import mongoose from "mongoose";
import User from "../models/User";
import Shop from "../models/Shop";
import Product from "../models/Product";
import Campaign from "../models/Campaign";
import BrandProfile from "../models/BrandProfile";
import CreatorProfile from "../models/CreatorProfile";
import Order from "../models/Order";
import Post from "../models/Post";

async function ensureDemoUser(
  name: string,
  email: string,
  role: "admin" | "brand" | "creator" | "consumer",
  extraData: any = {}
) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash: "Password123!",
      role,
      status: "active",
      ...extraData,
    });
  } else {
    // Ensure password matches Password123! and user is active for demo login integrity
    const isValidPassword = await user.comparePassword("Password123!");
    if (!isValidPassword || user.status !== "active") {
      user.passwordHash = "Password123!";
      user.status = "active";
      await user.save();
    }
  }
  return user;
}

export async function seedDemoData() {
  try {
    console.log("🌱 Verifying and seeding demo accounts & marketplace data...");

    // 1. Ensure Demo System Admins
    await ensureDemoUser("Adey System Admin", "admin@adey.com", "admin");
    await ensureDemoUser("Platform Admin", "admin@ethioinfluence.com", "admin");

    // 2. Ensure Demo Brand Seller
    const brandUser = await ensureDemoUser(
      "Addis Heritage Leather",
      "brand@ethioinfluence.com",
      "brand",
      { profilePic: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150" }
    );

    let brandProfile = await BrandProfile.findOne({ userId: brandUser._id });
    if (!brandProfile) {
      brandProfile = await BrandProfile.create({
        userId: brandUser._id,
        companyName: "Addis Heritage Leather Co.",
        website: "https://addisheritage.et",
        isApproved: true,
      });
    }

    // 3. Ensure Demo Creator Influencer
    const creatorUser = await ensureDemoUser(
      "Selamawit Tadesse",
      "creator@ethioinfluence.com",
      "creator",
      { profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
    );

    let creatorProfile = await CreatorProfile.findOne({ userId: creatorUser._id });
    if (!creatorProfile) {
      creatorProfile = await CreatorProfile.create({
        userId: creatorUser._id,
        displayName: creatorUser.name,
        username: "selam_creates",
        niche: "Fashion & Lifestyle",
        city: "Addis Ababa",
        bio: "Sharing authentic Ethiopian handcrafted fashion, leatherwear, and coffee culture.",
        socialLinks: {
          tiktok: "@selam_creates",
          instagram: "@selam_creates",
          telegram: "@selam_fashion",
        },
      });
    }

    // 4. Ensure Demo Consumer Buyer
    const buyerUser = await ensureDemoUser(
      "Dawit Abebe",
      "buyer@ethioinfluence.com",
      "consumer",
      {
        phone: "+251911223344",
        city: "Addis Ababa",
        address: "Bole Medhanialem, Near Edna Mall",
      }
    );

    // 5. Ensure Demo Shop
    let shop = await Shop.findOne({ ownerId: brandUser._id });
    if (!shop) {
      shop = await Shop.findOne({ shopSlug: "addis-heritage" });
    }
    if (!shop) {
      shop = await Shop.create({
        ownerId: brandUser._id,
        ownerRole: "brand",
        shopSlug: "addis-heritage",
        description: "Authentic premium handcrafted highland leather goods, roasted coffees, and traditional Ethiopian crafts.",
        logo: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200",
        defaultCommissionRate: 15,
        isActive: true,
      });
    }

    // 6. Ensure Demo Products (check each individually by sellerId and name)
    const demoProductsDef = [
      {
        name: "Highland Full-Grain Leather Backpack",
        description: "Hand-stitched Ethiopian highland leather backpack with brass hardware and dedicated laptop sleeve.",
        price: 3800,
        stock: 45,
        images: [
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
        ],
        category: "Fashion & Leather",
      },
      {
        name: "Yirgacheffe Single-Origin Specialty Roast (500g)",
        description: "Direct-trade organic floral and citrus grade 1 washed Arabica coffee beans, freshly roasted in Addis Ababa.",
        price: 650,
        stock: 120,
        images: [
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e",
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
        ],
        category: "Food & Beverage",
      },
      {
        name: "Handwoven Tibeb Traditional Cotton Shawl",
        description: "Master artisan handwoven pure Ethiopian Shemma cotton shawl with vibrant custom border embroidery.",
        price: 1450,
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d",
        ],
        category: "Fashion & Clothing",
      },
      {
        name: "Authentic Clay Jebena Coffee Ceremony Set",
        description: "Traditional handmade Ethiopian earthenware Jebena coffee pot with 6 matching ceramic sini cups.",
        price: 1950,
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
        ],
        category: "Home & Living",
      },
    ];

    const loadedProducts: any[] = [];
    for (const prodDef of demoProductsDef) {
      let product = await Product.findOne({
        sellerId: brandUser._id,
        name: prodDef.name,
      });

      if (!product) {
        product = await Product.create({
          sellerId: brandUser._id,
          sellerRole: "brand",
          ...prodDef,
          isActive: true,
        });
      }
      loadedProducts.push(product);
    }

    const [prod1, prod2, prod3, prod4] = loadedProducts;

    // 7. Ensure Demo Campaigns
    if (prod1 && prod2) {
      const camp1Title = "Meskel Holiday Mega Affiliate Boost";
      let camp1 = await Campaign.findOne({ sellerId: brandUser._id, title: camp1Title });

      if (!camp1) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await Campaign.create({
          sellerId: brandUser._id,
          title: camp1Title,
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
      }
    }

    if (prod3 && prod4) {
      const camp2Title = "Traditional Heritage Culture Launch";
      let camp2 = await Campaign.findOne({ sellerId: brandUser._id, title: camp2Title });

      if (!camp2) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await Campaign.create({
          sellerId: brandUser._id,
          title: camp2Title,
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
      }
    }

    // 8. Ensure Demo Creator Posts
    if (creatorUser && prod1) {
      const caption1 = "Styling the handcrafted Ethiopian highland leather backpack for my morning walk through Bole! The texture is unreal. Tap below to grab yours with 30-day attribution link! 🇪🇹✨";
      let post1 = await Post.findOne({ creatorId: creatorUser._id, caption: caption1 });

      if (!post1) {
        await Post.create({
          creatorId: creatorUser._id,
          creatorName: creatorUser.name,
          creatorUsername: "selam_creates",
          creatorAvatar: creatorUser.profilePic,
          caption: caption1,
          mediaUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
          taggedProductId: prod1._id,
          category: "Fashion & Leather",
        });
      }
    }

    if (creatorUser && prod2) {
      const caption2 = "Nothing compares to fresh single-origin Yirgacheffe Arabica roasted right here in Addis. Fruity notes, grade 1 washed beans. Check out the active boost campaign!";
      let post2 = await Post.findOne({ creatorId: creatorUser._id, caption: caption2 });

      if (!post2) {
        await Post.create({
          creatorId: creatorUser._id,
          creatorName: creatorUser.name,
          creatorUsername: "selam_creates",
          creatorAvatar: creatorUser.profilePic,
          caption: caption2,
          mediaUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800",
          taggedProductId: prod2._id,
          category: "Food & Beverage",
        });
      }
    }

    // 9. Ensure Demo Orders
    const demoOrderNumber = "ETH-ADE-84920";
    let order = await Order.findOne({ orderNumber: demoOrderNumber });
    if (!order && buyerUser && brandUser && creatorUser && prod1) {
      await Order.create({
        orderNumber: demoOrderNumber,
        buyerId: buyerUser._id,
        sellerId: brandUser._id,
        referrerId: creatorUser._id,
        items: [
          {
            productId: prod1._id,
            name: prod1.name,
            price: prod1.price,
            quantity: 1,
            image: prod1.images[0],
          },
        ],
        customerName: buyerUser.name,
        customerPhone: buyerUser.phone || "+251911223344",
        customerEmail: buyerUser.email,
        shippingAddress: {
          street: "Bole Medhanialem, Suite 402",
          city: "Addis Ababa",
          subcity: "Bole",
          note: "Deliver to office security desk",
        },
        totalAmount: prod1.price,
        platformFee: Math.round(prod1.price * 0.05),
        referrerCommission: Math.round(prod1.price * 0.15),
        sellerPayout: Math.round(prod1.price * 0.8),
        commissionRate: 15,
        commissionStatus: "pending",
        returnWindowDays: 7,
        paymentMethod: "telebirr",
        paymentStatus: "paid",
        orderStatus: "shipped",
        trackingNumber: "ET-POST-773921",
        shippingCarrier: "Ethiopian Postal Service",
        shippedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
    }

    console.log("✅ Ethiopian marketplace demo accounts & data verified successfully!");
  } catch (err) {
    console.error("⚠️ Error while seeding demo data:", err);
  }
}
