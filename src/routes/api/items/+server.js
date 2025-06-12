import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.join(process.cwd(), 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.yaml');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, 'images'), { recursive: true });
  }
}

async function loadItems() {
  await ensureDataDir();
  
  try {
    const content = await fs.readFile(ITEMS_FILE, 'utf8');
    const data = yaml.load(content);
    return data?.items || [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function saveItems(items) {
  await ensureDataDir();
  
  const data = { items };
  const yamlContent = yaml.dump(data, { 
    indent: 2,
    lineWidth: -1,
    noRefs: true 
  });
  
  await fs.writeFile(ITEMS_FILE, yamlContent, 'utf8');
}

export async function GET() {
  try {
    const items = await loadItems();
    return new Response(JSON.stringify(items), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error loading items:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load items' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST({ request }) {
  try {
    const newItem = await request.json();
    const items = await loadItems();
    
    items.push({
      title: newItem.title,
      url: newItem.url || null,
      image: newItem.image || null,
      createdAt: new Date().toISOString()
    });
    
    await saveItems(items);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving item:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save item' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT({ request }) {
  try {
    const { items } = await request.json();
    await saveItems(items);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating items:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update items' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}