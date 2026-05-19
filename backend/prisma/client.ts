import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client"

(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};
const connectionString = process.env.DATABASE_URL;
if (!connectionString){
    throw new Error("DATABASE_URL is not defined in environment variables");
}


const adapter = new PrismaPg({
    connectionString
});

export const prisma = new PrismaClient({ adapter });