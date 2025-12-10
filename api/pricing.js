import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const pricingPath = path.join(process.cwd(), 'server', 'config', 'pricing.json');
    const pricingData = JSON.parse(fs.readFileSync(pricingPath, 'utf-8'));

    res.status(200).json(pricingData);
}
