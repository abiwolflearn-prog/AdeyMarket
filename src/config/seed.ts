import mongoose from "mongoose";
import User from "../models/User";
import Shop from "../models/Shop";
import Product from "../models/Product";
import Campaign from "../models/Campaign";
import BrandProfile from "../models/BrandProfile";

export async function seedDemoData() {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log("ℹ️ Database already contains data. Skipping initial seeding.");
      return;
    }

    console.log("🌱 Database is empty. Seeding initial Ethiopian marketplace demo data...");

    // 1. Create Demo Brand Seller
    const brandUser = await User.create({
      name: "Addis Heritage Leather",
      email: "brand@ethioinfluence.com",
      passwordHash: "Password123!",
      role: "brand",
      profilePic: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150",
    });

    await BrandProfile.create({
      userId: brandUser._id,
      companyName: "Addis Heritage Leather Co.",
      website: "https://addisheritage.et",
      isApproved: true,
    });

    // 2. Create Demo Shop
    const shop = await Shop.create({
      ownerId: brandUser._id,
      ownerRole: "brand",
      shopSlug: "addis-heritage",
      description: "Authentic premium handcrafted highland leather goods, roasted coffees, and traditional Ethiopian crafts.",
      logo: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200",
      defaultCommissionRate: 15,
      isActive: true,
    });

    // 3. Create Demo Creator Influencer
    const creatorUser = await User.create({
      name: "Selamawit Tadesse",
      email: "creator@ethioinfluence.com",
      passwordHash: "Password123!",
      role: "creator",
      profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    });

    // 4. Create Demo Consumer
    await User.create({
      name: "Dawit Abebe",
      email: "buyer@ethioinfluence.com",
      passwordHash: "Password123!",
      role: "consumer",
    });

    // 5. Create Artisan Products
    const prod1 = await Product.create({
      sellerId: brandUser._id,
      sellerRole: "brand",
      name: "Highland Full-Grain Leather Backpack",
      description: "Hand-stitched Ethiopian highland leather backpack with brass hardware and dedicated laptop sleeve.",
      price: 3800,
      stock: 45,
      images: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
      ],
      category: "Fashion & Leather",
      isActive: true,
    });

    const prod2 = await Product.create({
      sellerId: brandUser._id,
      sellerRole: "brand",
      name: "Yirgacheffe Single-Origin Specialty Roast (500g)",
      description: "Direct-trade organic floral and citrus grade 1 washed Arabica coffee beans, freshly roasted in Addis Ababa.",
      price: 650,
      stock: 120,
      images: [
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
      ],
      category: "Food & Beverage",
      isActive: true,
    });

    const prod3 = await Product.create({
      sellerId: brandUser._id,
      sellerRole: "brand",
      name: "Handwoven Tibeb Traditional Cotton Shawl",
      description: "Master artisan handwoven pure Ethiopian Shemma cotton shawl with vibrant custom border embroidery.",
      price: 1450,
      stock: 35,
      images: [
        "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d",
      ],
      category: "Fashion & Clothing",
      isActive: true,
    });

    const prod4 = await Product.create({
      sellerId: brandUser._id,
      sellerRole: "brand",
      name: "Authentic Clay Jebena Coffee Ceremony Set",
      description: "Traditional handmade Ethiopian earthenware Jebena coffee pot with 6 matching ceramic sini cups.",
      price: 1950,
      stock: 20,
      images: [
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
      ],
      category: "Home & Living",
      isActive: true,
    });

    // 6. Create Active Boosted Affiliate Campaigns
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Campaign.create({
      sellerId: brandUser._id,
      title: "Meskel Holiday Mega Affiliate Boost",
      description: "Earn 25% commission on our entire leather collection and specialty coffee roasts throughout the holiday season!",
      boostedCommissionRate: 25,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: nextMonth,
      products: [prod1._id, prod2._id],
      bannerImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
      status: "active",
      targetNiche: "Lifestyle, Fashion & Food Creators",
      budget: 50000,
      totalReferrals: 14,
      totalSales: 48600,
    });

    await Campaign.create({
      sellerId: brandUser._id,
      title: "Traditional Heritage Culture Launch",
      description: "Special 20% boosted affiliate rate for cultural fashion and traditional coffee ceremony crafts.",
      boostedCommissionRate: 20,
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endDate: nextMonth,
      products: [prod3._id, prod4._id],
      bannerImage: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d",
      status: "active",
      targetNiche: "Heritage & Culture",
      budget: 30000,
      totalReferrals: 8,
      totalSales: 22400,
    });

    console.log("✅ Ethiopian marketplace demo data successfully seeded!");
  } catch (err) {
    console.error("⚠️ Error while seeding demo data:", err);
  }
}
