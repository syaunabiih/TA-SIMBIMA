const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isEmailInUseGlobally = async (email, excludeRole = null, excludeId = null) => {
  const queries = [];
  
  if (excludeRole === "MAHASISWA" && excludeId) {
    queries.push(prisma.mahasiswa.findFirst({ where: { email, id_mahasiswa: { not: excludeId } } }));
  } else {
    queries.push(prisma.mahasiswa.findUnique({ where: { email } }));
  }

  if (excludeRole === "FASILITATOR" && excludeId) {
    queries.push(prisma.fasilitator.findFirst({ where: { email, id_fasilitator: { not: excludeId } } }));
  } else {
    queries.push(prisma.fasilitator.findUnique({ where: { email } }));
  }

  if (excludeRole === "SUPERADMIN" && excludeId) {
    queries.push(prisma.ketuaPokja.findFirst({ where: { email, id_ketua_pokja: { not: excludeId } } }));
  } else {
    queries.push(prisma.ketuaPokja.findUnique({ where: { email } }));
  }

  const results = await Promise.all(queries);
  return results.some(user => user !== null);
};

const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = { isEmailInUseGlobally, isValidEmailFormat };
