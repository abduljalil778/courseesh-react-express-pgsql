import {Prisma, PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export const findAllUsers = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
        },
        orderBy: {
            name: "asc",
        }
    })

    return users;
}
