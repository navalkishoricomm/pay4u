const mongoose = require('mongoose');
const BrandVoucher = require('../models/BrandVoucher');
const VoucherDenomination = require('../models/VoucherDenomination');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pay4u', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const brands = [
  // --- Shopping ---
  {
    name: 'Amazon Pay Gift Card',
    domain: 'amazon.in',
    category: 'Shopping',
    description: 'Amazon Pay Gift Cards are the perfect way to give them exactly what they\'re hoping for - even if you don\'t know what it is. Recipients can choose from millions of items storewide.',
    denominations: [500, 1000, 2000, 5000, 10000],
    discount: 0
  },
  {
    name: 'Flipkart Gift Card',
    domain: 'flipkart.com',
    category: 'Shopping',
    description: 'The Flipkart Gift Card is the perfect gift for any occasion. Shop from a wide range of products across categories like electronics, fashion, home essentials, and more.',
    denominations: [500, 1000, 2000, 5000],
    discount: 0
  },
  {
    name: 'Myntra Gift Card',
    domain: 'myntra.com',
    category: 'Shopping',
    description: 'Myntra is India\'s leading fashion lifestyle destination. Gift a Myntra Gift Card and let your loved ones choose from the latest trends in clothing, footwear, and accessories.',
    denominations: [500, 1000, 2000, 5000],
    discount: 2.0
  },
  {
    name: 'Lifestyle',
    domain: 'lifestylestores.com',
    category: 'Shopping',
    description: 'Lifestyle is India\'s leading fashion destination for the latest trends. Gift a Lifestyle card for the best in apparel, footwear, and accessories.',
    denominations: [500, 1000, 2000, 5000],
    discount: 3.0
  },
  {
    name: 'Shoppers Stop',
    domain: 'shoppersstop.com',
    category: 'Shopping',
    description: 'Shoppers Stop offers a wide range of fashion and lifestyle products. It is a one-stop destination for all your fashion needs.',
    denominations: [500, 1000, 2000, 5000],
    discount: 3.0
  },
  {
    name: 'Westside',
    domain: 'mywestside.com',
    category: 'Shopping',
    description: 'Westside offers a stylish range of apparel, footwear, and home furniture. It is one of the most preferred fashion destinations in India.',
    denominations: [500, 1000, 2000, 5000],
    discount: 3.0
  },
  {
    name: 'Pantaloons',
    domain: 'pantaloons.com',
    category: 'Shopping',
    description: 'Pantaloons is a playground for fashion lovers. With a wide range of clothing for men, women, and kids, it is a favorite shopping destination.',
    denominations: [500, 1000, 2000, 5000],
    discount: 3.0
  },
  {
    name: 'Reliance Trends',
    domain: 'relianceretail.com',
    category: 'Shopping',
    description: 'Trends is India\'s largest fashion retail chain. It offers trendy and high-quality fashion at affordable prices.',
    denominations: [500, 1000, 2000],
    discount: 2.5
  },

  // --- Food & Dining ---
  {
    name: 'Swiggy Money',
    domain: 'swiggy.com',
    category: 'Food & Dining',
    description: 'Swiggy is India\'s leading food ordering and delivery platform. Use Swiggy Money to order food from your favorite restaurants.',
    denominations: [250, 500, 1000, 2000],
    discount: 1.5
  },
  {
    name: 'Zomato',
    domain: 'zomato.com',
    category: 'Food & Dining',
    description: 'Zomato lets you discover restaurants to eat out at or order in. Gift a Zomato card for a delightful dining experience.',
    denominations: [250, 500, 1000, 2000],
    discount: 1.5
  },
  {
    name: 'Domino\'s Pizza',
    domain: 'dominos.co.in',
    category: 'Food & Dining',
    description: 'Enjoy hot and fresh pizzas from Domino\'s. The perfect gift for pizza lovers.',
    denominations: [250, 500, 1000],
    discount: 4.0
  },
  {
    name: 'Pizza Hut',
    domain: 'pizzahut.co.in',
    category: 'Food & Dining',
    description: 'Pizza Hut offers a wide range of pizzas, pasta, and sides. Treat your friends and family to a delicious meal.',
    denominations: [250, 500, 1000],
    discount: 4.0
  },
  {
    name: 'KFC',
    domain: 'kfc.co.in',
    category: 'Food & Dining',
    description: 'KFC is famous for its finger-lickin\' good chicken. Gift a KFC card for a crispy and tasty treat.',
    denominations: [250, 500, 1000],
    discount: 3.0
  },
  {
    name: 'Barbeque Nation',
    domain: 'barbequenation.com',
    category: 'Food & Dining',
    description: 'Barbeque Nation offers a unique DIY grilling experience. Enjoy a wide variety of starters and a lavish buffet.',
    denominations: [500, 1000, 2000],
    discount: 3.0
  },
  {
    name: 'Starbucks',
    domain: 'starbucks.in',
    category: 'Food & Dining',
    description: 'Starbucks is the premier roaster and retailer of specialty coffee. Enjoy your favorite coffee and snacks at Starbucks.',
    denominations: [250, 500, 1000, 2000],
    discount: 2.0
  },
  {
    name: 'Costa Coffee',
    domain: 'costacoffee.in',
    category: 'Food & Dining',
    description: 'Costa Coffee offers the finest coffee and a warm atmosphere. A great gift for coffee enthusiasts.',
    denominations: [250, 500, 1000],
    discount: 3.0
  },

  // --- Entertainment ---
  {
    name: 'BookMyShow',
    domain: 'bookmyshow.com',
    category: 'Entertainment',
    description: 'BookMyShow is India\'s largest entertainment ticketing portal. Book tickets for movies, events, plays, and sports.',
    denominations: [250, 500, 1000],
    discount: 2.0
  },
  {
    name: 'PVR Cinemas',
    domain: 'pvrcinemas.com',
    category: 'Entertainment',
    description: 'PVR Cinemas offers a world-class movie-watching experience. Catch the latest blockbusters at a PVR near you.',
    denominations: [250, 500, 1000],
    discount: 2.5
  },
  {
    name: 'Google Play',
    domain: 'play.google.com',
    category: 'Entertainment',
    description: 'Google Play Gift Codes can be used to purchase apps, games, books, and movies from the Google Play Store.',
    denominations: [100, 300, 500, 1000, 1500],
    discount: 0
  },

  // --- Travel ---
  {
    name: 'Uber',
    domain: 'uber.com',
    category: 'Travel',
    description: 'Get a reliable ride in minutes with the Uber app. Gift an Uber card for convenient and safe travel.',
    denominations: [250, 500, 1000],
    discount: 1.0
  },
  {
    name: 'Ola Cabs',
    domain: 'olacabs.com',
    category: 'Travel',
    description: 'Ola offers safe and affordable rides across India. Book a cab, auto, or bike with ease.',
    denominations: [250, 500, 1000],
    discount: 1.0
  },
  {
    name: 'MakeMyTrip',
    domain: 'makemytrip.com',
    category: 'Travel',
    description: 'MakeMyTrip is India\'s leading travel portal. Plan your holidays, book flights, and hotels with ease.',
    denominations: [1000, 2000, 5000, 10000],
    discount: 2.0
  },
  {
    name: 'Yatra',
    domain: 'yatra.com',
    category: 'Travel',
    description: 'Yatra.com is a leading online travel agency in India. Book flights, hotels, and holiday packages.',
    denominations: [1000, 2000, 5000],
    discount: 2.0
  },
  {
    name: 'Cleartrip',
    domain: 'cleartrip.com',
    category: 'Travel',
    description: 'Cleartrip makes travel simple. Book flights and hotels for your next trip.',
    denominations: [1000, 2000, 5000],
    discount: 2.0
  },

  // --- Health & Beauty ---
  {
    name: 'Nykaa',
    domain: 'nykaa.com',
    category: 'Health & Beauty',
    description: 'Nykaa is a premier online beauty destination. Shop for makeup, skincare, haircare, and wellness products.',
    denominations: [500, 1000, 2000, 5000],
    discount: 2.0
  },
  {
    name: 'Apollo Pharmacy',
    domain: 'apollopharmacy.in',
    category: 'Health & Beauty',
    description: 'Apollo Pharmacy is India\'s largest pharmacy chain. Buy medicines, health supplements, and personal care products.',
    denominations: [250, 500, 1000, 2000],
    discount: 3.0
  },
  {
    name: 'The Body Shop',
    domain: 'thebodyshop.in',
    category: 'Health & Beauty',
    description: 'The Body Shop offers a wide range of nature-inspired beauty products. Cruelty-free and ethically sourced.',
    denominations: [500, 1000, 2000],
    discount: 3.0
  },
  {
    name: 'Kama Ayurveda',
    domain: 'kamaayurveda.com',
    category: 'Health & Beauty',
    description: 'Kama Ayurveda offers authentic Ayurvedic beauty and wellness products. Experience the power of Ayurveda.',
    denominations: [500, 1000, 2000],
    discount: 3.0
  },

  // --- Electronics ---
  {
    name: 'Croma',
    domain: 'croma.com',
    category: 'Electronics',
    description: 'Croma is a leading electronics retailer. Shop for smartphones, laptops, appliances, and more.',
    denominations: [500, 1000, 2000, 5000, 10000],
    discount: 1.5
  },
  {
    name: 'Reliance Digital',
    domain: 'reliancedigital.in',
    category: 'Electronics',
    description: 'Reliance Digital offers the latest gadgets and electronics. Discover technology that makes life easier.',
    denominations: [500, 1000, 2000, 5000, 10000],
    discount: 1.5
  },

  // --- Other ---
  {
    name: 'Woohoo Gift Card',
    domain: 'woohoo.in',
    category: 'Other',
    description: 'The Woohoo Gift Card gives the recipient the freedom to choose from over 100+ brands. The ultimate gift of choice.',
    denominations: [500, 1000, 2000, 5000],
    discount: 0
  }
];

const seedBrandVouchers = async () => {
  try {
    console.log('Starting Brand Voucher seeding...');

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please seed users first.');
      process.exit(1);
    }
    const adminId = adminUser._id;
    console.log(`Using Admin ID: ${adminId}`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const brand of brands) {
      // Generate image URL using Clearbit Logo API
      // Using a fallback for common brands if needed, but Clearbit is reliable for major domains
      const imageUrl = `https://logo.clearbit.com/${brand.domain}`;
      
      // Upsert Brand Voucher
      let voucher = await BrandVoucher.findOne({ brandName: brand.name });
      
      const voucherData = {
        brandName: brand.name,
        description: brand.description,
        image: imageUrl,
        category: brand.category,
        isActive: true,
        termsAndConditions: `Terms and conditions apply. Redeemable at ${brand.domain} or their outlets. Valid for 1 year from date of issue.`,
        validityPeriod: 365,
        createdBy: adminId
      };

      if (voucher) {
        // Update existing
        voucher.set(voucherData);
        await voucher.save();
        console.log(`Updated Brand: ${brand.name}`);
        updatedCount++;
      } else {
        // Create new
        voucher = new BrandVoucher(voucherData);
        await voucher.save();
        console.log(`Created Brand: ${brand.name}`);
        addedCount++;
      }

      // Seed Denominations for this brand
      for (const amount of brand.denominations) {
        // Check if denomination exists
        let denomination = await VoucherDenomination.findOne({
          brandVoucher: voucher._id,
          denomination: amount
        });

        const denominationData = {
          brandVoucher: voucher._id,
          denomination: amount,
          discountPercentage: brand.discount,
          maxQuantityPerUser: 10,
          totalAvailableQuantity: 10000, // Unlimited stock simulation
          isActive: true,
          createdBy: adminId
        };

        if (denomination) {
          denomination.set(denominationData);
          await denomination.save();
        } else {
          denomination = new VoucherDenomination(denominationData);
          await denomination.save();
        }
      }
      console.log(`  - Processed ${brand.denominations.length} denominations for ${brand.name}`);
    }

    console.log('\n==========================================');
    console.log('BRAND VOUCHER SEEDING SUMMARY');
    console.log('==========================================');
    console.log(`Total Brands Processed: ${brands.length}`);
    console.log(`Brands Created: ${addedCount}`);
    console.log(`Brands Updated: ${updatedCount}`);
    console.log('==========================================');

  } catch (error) {
    console.error('Error seeding brand vouchers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Execute if run directly
if (require.main === module) {
  connectDB().then(seedBrandVouchers);
}

module.exports = { seedBrandVouchers };
