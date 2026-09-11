import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';
import fs from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // In Vercel and local Node environments
  const potentialPaths = [
    path.resolve(process.cwd(), 'public/data/elb_request_count_8c0756.csv'),
    path.resolve('public/data/elb_request_count_8c0756.csv'),
  ];

  for (const filePath of potentialPaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(content);
    }
  }

  // Fallback redirect to static public asset
  return res.redirect('/data/elb_request_count_8c0756.csv');
}
