export type WizardStep =
'property' |
'greeting' |
'access' |
'rules' |
'tech' |
'inventory' |
'leisure' |
'faqs';

export interface WizardFormData {
  // Step 1: Property
  propertyName: string;
  location: string;
  slug: string;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  brandColor: string;
  description: string;

  // Step 2: Greeting
  greetingTitle: string;
  hostName: string;
  personalMessage: string;

  // Step 3: Access
  accessType: 'key' | 'code' | 'smart_lock' | 'meet';
  accessInstructions: string;
  accessCode: string;

  // Step 4: Rules
  checkInTime: string;
  checkOutTime: string;
  houseRules: string;
  petsAllowed: 'yes' | 'no' | 'inquire';
  partiesAllowed: 'yes' | 'no' | 'inquire';

  // Step 5: Tech
  wifiName: string;
  wifiPassword: string;
  tvInstructions: string;
  otherDevices: string;

  // Step 6: Inventory
  amenities: string[];
  appliances: string[];
  inventoryNotes: string;

  // Step 7: Leisure
  restaurants: string;
  activities: string;
  beaches: string;

  // Step 8: FAQs
  faqs: Array<{question: string;answer: string;}>;
  emergencyContact: string;
  finalNotes: string;
}

export const INITIAL_DATA: WizardFormData = {
  propertyName: '',
  location: '',
  slug: '',
  guests: 2,
  bedrooms: 1,
  bathrooms: 1,
  brandColor: '#1e3a5f',
  description: '',
  greetingTitle: 'Welcome!',
  hostName: '',
  personalMessage: '',
  accessType: 'key',
  accessInstructions: '',
  accessCode: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  houseRules: '',
  petsAllowed: 'no',
  partiesAllowed: 'no',
  wifiName: '',
  wifiPassword: '',
  tvInstructions: '',
  otherDevices: '',
  amenities: [],
  appliances: [],
  inventoryNotes: '',
  restaurants: '',
  activities: '',
  beaches: '',
  faqs: [{ question: '', answer: '' }],
  emergencyContact: '',
  finalNotes: ''
};

export const STEPS: {id: WizardStep;label: string;icon: string;}[] = [
{ id: 'property', label: 'Propiedad', icon: 'Home' },
{ id: 'greeting', label: 'Saludo', icon: 'Sparkles' },
{ id: 'access', label: 'Acceso', icon: 'Key' },
{ id: 'rules', label: 'Normas', icon: 'ShieldAlert' },
{ id: 'tech', label: 'Tech', icon: 'Wifi' },
{ id: 'inventory', label: 'Inventario', icon: 'Box' },
{ id: 'leisure', label: 'Ocio', icon: 'Utensils' },
{ id: 'faqs', label: 'FAQs', icon: 'HelpCircle' }];