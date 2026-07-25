const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    console.log('[pushController] Menerima subscription dari client:', req.body);
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: "Invalid subscription payload" });
    }

    const { id, role } = req.user;

    let updateData = {
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
    };

    if (role === 'MAHASISWA') {
      updateData.id_mahasiswa = id;
    } else if (role === 'FASILITATOR') {
      updateData.id_fasilitator = id;
    } else if (role === 'SUPERADMIN' || role === 'KETUA_POKJA') {
      updateData.id_ketua_pokja = id;
    }

    // Check if subscription with this endpoint already exists
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint }
    });

    if (existing) {
      // Update existing subscription user association if needed
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      await prisma.pushSubscription.create({
        data: updateData
      });
    }

    res.status(201).json({ message: "Subscription saved successfully" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint }
    });

    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
};
