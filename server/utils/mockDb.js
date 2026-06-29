import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../mock_users.json');
const RECORDS_FILE = path.join(__dirname, '../mock_records.json');

export const getMockUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading mock users:', error);
    return [];
  }
};

export const saveMockUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving mock users:', error);
  }
};

export const getMockRecords = () => {
  try {
    if (!fs.existsSync(RECORDS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(RECORDS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading mock records:', error);
    return [];
  }
};

export const saveMockRecords = (records) => {
  try {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving mock records:', error);
  }
};
