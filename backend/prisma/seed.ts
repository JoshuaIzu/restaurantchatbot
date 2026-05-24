import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({ adapter });

async function main() {
    const menuItems = [
        { name: "Jollof Rice & Fried Plantain", price: 3500, category: "main" },
        { name: "Pounded Yam & Egusi Soup", price: 4000, category: "main" },
        { name: "Suya (Beef)", price: 2500, category: "main" },
        { name: "Pepper Soup (Goat Meat)", price: 3000, category: "main" },
        { name: "Fried Rice & Chicken", price: 3500, category: "main" },
        { name: "Amala & Ewedu", price: 3000, category: "main" },
        { name: "Chapman", price: 1500, category: "drink" },
        { name: "Zobo Drink", price: 800, category: "drink" },
        { name: "Chin Chin", price: 500, category: "snack" },
        { name: "Puff-Puff", price: 300, category: "snack" },
    ];

    for (const item of menuItems) {
        await prisma.menuItem.create({ data: item });
    }

    console.log("Menu items seeded successfully");
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });