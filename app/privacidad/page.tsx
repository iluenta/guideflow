import React from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-[#0f172a]">
      <LandingNavbar />
      
      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold font-poppins mb-12 tracking-tight text-[#1e3a8a]">
          Política de Privacidad
        </h1>
        
        <div className="space-y-12 text-[#475569] leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              1. Responsable del tratamiento
            </h2>
            <p>
              Hospyia Labs S.L. (en adelante, &ldquo;Hospyia&rdquo;), con NIF [NIF - REVISAR CON ABOGADO] y domicilio en [Dirección - REVISAR CON ABOGADO], es el responsable del tratamiento de tus datos personales.
              Puedes contactar con nosotros en <a href="mailto:privacidad@hospyia.com" className="text-blue-600 underline">privacidad@hospyia.com</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              2. Datos que recopilamos
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-[#0f172a] mb-2">A. De propietarios y gestores</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Datos de registro: nombre, email y contraseña.</li>
                  <li>Datos de las propiedades: nombre, dirección y contenido de la guía.</li>
                  <li>Datos de facturación y pago: gestionados a través de proveedores externos.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#0f172a] mb-2">B. De huéspedes (Uso de la guía)</h3>
                <p className="mb-2 italic">Para mejorar el servicio, cuando utilizas una guía digital registramos:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Momentos de apertura (timestamp).</li>
                  <li>Secciones consultadas y tiempo de permanencia en cada una.</li>
                  <li>Información técnica básica: navegador, sistema operativo y tipo de dispositivo.</li>
                  <li><strong>Importante:</strong> No registramos tu nombre, email, teléfono ni ubicación exacta.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              3. Finalidades del tratamiento
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prestación y mantenimiento del servicio de guías digitales.</li>
              <li>Análisis agregado del uso para mejorar la experiencia de usuario y el contenido de las guías.</li>
              <li>Gestión administrativa y facturación de las cuentas de propietarios.</li>
              <li>Atención de consultas y soporte técnico.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              4. Base legal
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Ejecución de contrato:</strong> Para la gestión de cuentas de propietarios.</li>
              <li><strong>Interés legítimo (Art. 6.1.f RGPD):</strong> Para el análisis de uso y mejora del producto, garantizando siempre la mínima intrusión en la privacidad.</li>
              <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales (si aplica).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              5. Plazo de conservación
            </h2>
            <p>
              Los datos de uso de huéspedes se conservan durante un máximo de 12 meses desde la finalización de la estancia, tras lo cual se anonimizan o eliminan.
              Los datos de propietarios se conservan mientras se mantenga la relación contractual o durante los plazos legales obligatorios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              6. Destinatarios
            </h2>
            <p>
              Tus datos no se venden a terceros. Utilizamos proveedores de confianza para prestar el servicio (como Supabase para almacenamiento de datos y Vercel para el alojamiento), que actúan como encargados del tratamiento bajo estrictas cláusulas de confidencialidad.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              7. Transferencias internacionales
            </h2>
            <p>
              [REVISAR CON ABOGADO] Algunos de nuestros proveedores pueden estar ubicados fuera del Espacio Económico Europeo. En tales casos, nos aseguramos de que existan garantías adecuadas (como Cláusulas Contractuales Tipo) para proteger tus datos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              8. Tus derechos
            </h2>
            <p>
              Tienes derecho a acceder, rectificar, suprimir, limitar u oponerte al tratamiento de tus datos, así como a la portabilidad de los mismos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#1e3a8a] uppercase tracking-wider text-sm">
              9. Cómo ejercer tus derechos
            </h2>
            <p>
              Envía un email a <a href="mailto:privacidad@hospyia.com" className="text-blue-600 underline">privacidad@hospyia.com</a> adjuntando copia de tu DNI o documento equivalente para identificarte.
            </p>
          </section>

          <section className="space-y-4 border-t border-landing-rule pt-8 mt-12">
            <p className="text-sm italic">
              Este documento ha sido generado el 30 de abril de 2026. Recomendamos su revisión periódica. 
              Si consideras que no hemos atendido correctamente tus derechos, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" className="text-blue-600 underline">www.aepd.es</a>).
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
