import prisma from '../libs/prisma.js';

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
