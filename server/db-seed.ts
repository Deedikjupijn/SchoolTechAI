
import { db } from './db';
import { deviceCategories, devices } from '@shared/schema';

async function seed() {
  // Insert categories
  const categories = await db.insert(deviceCategories).values([
    { name: 'Lathes', icon: 'precision_manufacturing' },
    { name: 'Mills', icon: 'build' },
    { name: 'Drills', icon: 'drill' }
  ]).returning();
  
  console.log('Created categories:', categories);

  // Insert devices
  const devicesData = await db.insert(devices).values([
    {
      name: 'Basic Lathe',
      icon: 'precision_manufacturing',
      shortDescription: 'Entry-level metal lathe for basic turning operations',
      categoryId: categories[0].id,
      specifications: { speed: '0-2500 RPM', powerInput: '750W', swingOverBed: '8 inches' },
      materials: ['Steel', 'Aluminum', 'Brass'],
      safetyRequirements: ['Eye protection', 'No loose clothing', 'Tie back long hair'],
      usageInstructions: ['Ensure work piece is secure', 'Start at low speed', 'Use proper cutting tools'],
      troubleshooting: ['Check belt tension if motor stalls', 'Verify tool height alignment'],
      mediaItems: []
    },
    {
      name: 'Industrial Mill',
      icon: 'build',
      shortDescription: 'Versatile vertical milling machine for precision work',
      categoryId: categories[1].id,
      specifications: { 
        tableSize: '42" x 9"',
        motorPower: '2HP',
        spindleSpeed: '50-3000 RPM'
      },
      materials: ['Steel', 'Aluminum', 'Titanium', 'Plastic'],
      safetyRequirements: ['Safety glasses', 'Hearing protection', 'No gloves while operating'],
      usageInstructions: ['Check tool tightness', 'Secure workpiece with proper clamps', 'Use appropriate feeds and speeds'],
      troubleshooting: ['Verify spindle alignment', 'Check for loose gibs', 'Ensure proper lubrication'],
      mediaItems: []
    },
    {
      name: 'Bench Drill Press',
      icon: 'drill',
      shortDescription: 'Precise drilling machine for workshop use',
      categoryId: categories[2].id,
      specifications: {
        drillCapacity: '5/8"',
        motorPower: '1/2 HP',
        speeds: '12 speed settings'
      },
      materials: ['Wood', 'Metal', 'Plastic'],
      safetyRequirements: ['Wear eye protection', 'Secure loose clothing', 'Use proper clamps'],
      usageInstructions: ['Select appropriate speed', 'Use sharp drill bits', 'Clamp work securely'],
      troubleshooting: ['Check belt tension', 'Verify speed selection', 'Ensure proper bit sharpness'],
      mediaItems: []
    },
    {
      name: 'CNC Lathe',
      icon: 'precision_manufacturing',
      shortDescription: 'Computer-controlled lathe for complex turning operations',
      categoryId: categories[0].id,
      specifications: {
        control: 'Fanuc Compatible',
        spindleSpeed: '100-4000 RPM',
        chuckSize: '8 inch',
        toolPositions: '8'
      },
      materials: ['Steel', 'Aluminum', 'Titanium', 'Exotic Alloys'],
      safetyRequirements: ['Training required', 'Emergency stop familiarity', 'Regular maintenance checks'],
      usageInstructions: ['Verify program before running', 'Check tool offsets', 'Monitor coolant levels'],
      troubleshooting: ['Check error codes', 'Verify tool compensation', 'Monitor axis positions'],
      mediaItems: []
    }
  ]).returning();

  console.log('Created devices:', devicesData);
}

seed().catch(console.error);
