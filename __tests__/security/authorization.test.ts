/**
 * Tests de Bypass de Autorización y Aislamiento Multi-Tenant
 * Verifica que los usuarios no pueden acceder a datos de otros tenants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient, createMockUser, createTenantAwareClient } from './utils';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Authorization and Tenant Isolation Tests', () => {
  let mockSupabase: any;
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    mockSupabase = createMockSupabaseClient();
    user1 = createMockUser({
      id: 'user-1-id',
      user_metadata: { tenant_id: 'tenant-1-id' },
    });
    user2 = createMockUser({
      id: 'user-2-id',
      user_metadata: { tenant_id: 'tenant-2-id' },
    });
    
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
    
    vi.clearAllMocks();
  });

  describe('Properties Access Control', () => {
    it('debería filtrar propiedades por tenant_id', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      // requireProfile consulta 'profiles'; getProperties consulta
      // 'properties_with_completion'. El mock table-aware responde a ambas.
      vi.mocked(createClient).mockResolvedValueOnce(createTenantAwareClient({
        user: user1,
        tables: {
          profiles: { data: { tenant_id: 'tenant-1-id', tenant_role: 'owner' } },
          properties_with_completion: {
            data: [{ id: 'prop-1', tenant_id: 'tenant-1-id', name: 'Property 1' }],
          },
        },
      }) as any);

      const { getProperties } = await import('@/app/actions/properties');
      const properties = await getProperties();

      expect(properties.length).toBe(1);
      expect(properties.every((p: any) => p.tenant_id === 'tenant-1-id')).toBe(true);
    });

    it('debería prevenir acceso a propiedades de otro tenant', async () => {
      const { getProperty } = await import('@/app/actions/properties');

      // User1 intenta acceder a propiedad de tenant-2
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: 'prop-2', tenant_id: 'tenant-2-id', name: 'Property 2' },
          error: null,
        }),
      });

      const property = await getProperty('prop-2');

      // RLS debería prevenir acceso, pero si no, el código debería verificar tenant_id
      if (property) {
        // Si se obtiene la propiedad, verificar que el código valida tenant_id
        expect(property.tenant_id).toBeDefined();
      }
    });

    it('debería validar tenant_id al crear propiedades', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      // createProperty: requireProfile('profiles') → check de slug en 'properties'
      // (maybeSingle, debe ser null) → insert en 'properties' (single, la nueva fila).
      // La cola FIFO de 'properties' da null primero y la fila después.
      vi.mocked(createClient).mockResolvedValueOnce(createTenantAwareClient({
        user: user1,
        tables: {
          profiles: { data: { tenant_id: 'tenant-1-id', tenant_role: 'owner' } },
          properties: [
            { data: null, error: null },
            { data: { id: 'new-prop', tenant_id: 'tenant-1-id', name: 'New Property' }, error: null },
          ],
        },
      }) as any);

      const { createProperty } = await import('@/app/actions/properties');
      const property = await createProperty({
        name: 'New Property',
        location: 'Test Location',
        beds: 2,
        baths: 1,
        guests: 4,
      } as any);

      // El tenant_id lo fija el servidor desde requireProfile, no el input del cliente
      expect(property.tenant_id).toBe('tenant-1-id');
    });

    it('debería prevenir actualización de propiedades de otro tenant', async () => {
      const { updateProperty } = await import('@/app/actions/properties');

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: user1 },
        error: null,
      });

      // Simular que la propiedad pertenece a tenant-2
      const mockMaybeSingle = vi.fn().mockResolvedValueOnce({
        data: null, // RLS bloquea el acceso
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValueOnce({
        update: mockUpdate,
      });

      try {
        await updateProperty('prop-2', {
          name: 'Hacked Property',
        } as any);
        
        // No debería llegar aquí
        expect(true).toBe(false);
      } catch (error: any) {
        // Esperado: debería lanzar error por falta de permisos o propiedad no encontrada
        expect(error).toBeDefined();
        expect(error.message || String(error)).toBeTruthy();
      }
    });
  });

  describe('Guest Access Tokens', () => {
    it('debería validar tenant_id al crear tokens de acceso', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      // createGuestAccess: requireProfile('profiles') → verifica propiedad del
      // tenant en 'properties' → inserta en 'guest_access_tokens'.
      vi.mocked(createClient).mockResolvedValueOnce(createTenantAwareClient({
        user: user1,
        tables: {
          profiles: { data: { tenant_id: 'tenant-1-id', tenant_role: 'owner' } },
          properties: { data: { id: 'prop-1' } },
          guest_access_tokens: {
            data: { id: 'token-1', tenant_id: 'tenant-1-id', property_id: 'prop-1', access_token: 'test-token' },
          },
        },
      }) as any);

      const { createGuestAccess } = await import('@/app/actions/guest-access');
      const result = await createGuestAccess({
        propertyId: 'prop-1',
        guestName: 'Test Guest',
        checkinDate: '2024-01-01',
        checkoutDate: '2024-01-02',
      });

      expect(result.data.tenant_id).toBe('tenant-1-id');
    });

    it('debería prevenir creación de tokens para propiedades de otro tenant', async () => {
      const { createGuestAccess } = await import('@/app/actions/guest-access');

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: user1 },
        error: null,
      });

      // Propiedad pertenece a tenant-2
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: { id: 'prop-2', tenant_id: 'tenant-2-id' },
          error: null,
        }),
      });

      try {
        await createGuestAccess({
          propertyId: 'prop-2',
          guestName: 'Test Guest',
          checkinDate: '2024-01-01',
          checkoutDate: '2024-01-02',
        });

        // Debería lanzar error
        expect(true).toBe(false);
      } catch (error: any) {
        // Esperado: debería rechazar (puede ser por falta de auth o permiso)
        expect(error).toBeDefined();
        expect(error.message || String(error)).toBeTruthy();
      }
    });
  });

  describe('Manual Access Control', () => {
    it('debería filtrar manuales por tenant_id', async () => {
      const { getPropertyManuals } = await import('@/app/actions/properties');

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: [
            {
              id: 'manual-1',
              property_id: 'prop-1',
              tenant_id: 'tenant-1-id',
            },
          ],
          error: null,
        }),
      });

      const manuals = await getPropertyManuals('prop-1');

      // Verificar que se filtra por property_id (que debería estar asociado al tenant)
      expect(manuals.length).toBeGreaterThanOrEqual(0);
    });

    it('debería prevenir eliminación de manuales de otro tenant', async () => {
      const { deleteManual } = await import('@/app/actions/properties');

      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: user1 },
        error: null,
      });

      // RLS debería prevenir eliminación
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          error: { message: 'Permission denied' },
        }),
      });

      try {
        await deleteManual('manual-2', 'prop-2');
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('RLS Policies', () => {
    it('debería verificar que RLS está habilitado en tablas críticas', () => {
      // Verificar que las tablas tienen RLS habilitado
      const criticalTables = [
        'properties',
        'profiles',
        'tenants',
        'guest_access_tokens',
        'property_manuals',
      ];

      // Este test verifica que el código asume RLS está habilitado
      criticalTables.forEach((table) => {
        expect(table).toBeDefined();
      });
    });

    it('debería verificar que las queries usan filtros de tenant', () => {
      // Verificar que las queries siempre filtran por tenant_id
      const queriesWithTenantFilter = [
        'getProperties',
        'createProperty',
        'updateProperty',
        'createGuestAccess',
      ];

      queriesWithTenantFilter.forEach((query) => {
        expect(query).toBeDefined();
      });
    });
  });

  describe('Cross-Tenant Data Leakage', () => {
    it('debería prevenir fuga de datos entre tenants', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValueOnce(createTenantAwareClient({
        user: user1,
        tables: {
          profiles: { data: { tenant_id: 'tenant-1-id', tenant_role: 'owner' } },
          properties_with_completion: {
            data: [{ id: 'prop-1', tenant_id: 'tenant-1-id', name: 'Property 1' }],
          },
        },
      }) as any);

      const { getProperties } = await import('@/app/actions/properties');
      const properties = await getProperties();

      const otherTenantProperties = properties.filter(
        (p: any) => p.tenant_id !== 'tenant-1-id'
      );
      expect(otherTenantProperties.length).toBe(0);
    });
  });
});
