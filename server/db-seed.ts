
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

  // Insert some sample devices
  const devices = await db.insert(devices).values([
    {
      name: 'Basic Lathe',
      icon: 'precision_manufacturing',
      shortDescription: 'Entry-level metal lathe for basic turning operations',
      categoryId: categories[0].id,
      specifications: { speed: '0-2500 RPM', powerInput: '750W' },
      materials: ['Steel', 'Aluminum', 'Brass'],
      safetyRequirements: ['Eye protection', 'No loose clothing'],
      usageInstructions: ['Ensure work piece is secure', 'Start at low speed'],
      troubleshooting: ['Check belt tension if motor stalls'],
      mediaItems: []
    }
  ]).returning();

  console.log('Created devices:', devices);
}

seed().catch(console.error);
