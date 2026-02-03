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

const voucherData = [
  // Shopping
  {
    brandName: 'Amazon Pay Gift Card',
    description: 'Amazon Pay Gift Cards are the perfect way to give them exactly what they\'re hoping for - even if you don\'t know what it is. Recipients can choose from millions of items storewide.',
    image: 'https://www.google.com/s2/favicons?domain=amazon.in&sz=128',
    category: 'Shopping',
    website: 'amazon.in',
    termsAndConditions: '1. Gift Cards are valid for 365 days from the date of purchase. 2. Redeemable across all products on Amazon.in except apps, certain global store products and other Amazon Pay gift cards.',
    denominations: [500, 1000, 2000, 5000, 10000]
  },
  {
    brandName: 'Flipkart Gift Card',
    description: 'Flipkart Gift Cards empower you to buy anything from a vast selection of products across categories like electronics, fashion, home essentials, and more.',
    image: 'https://www.google.com/s2/favicons?domain=flipkart.com&sz=128',
    category: 'Shopping',
    website: 'flipkart.com',
    termsAndConditions: '1. The Gift Card is valid for 12 months from the date of issuance. 2. Gift Cards can be redeemed online against sellers listed on www.flipkart.com.',
    denominations: [500, 1000, 2500, 5000]
  },
  {
    brandName: 'Myntra Gift Card',
    description: 'Myntra is India\'s leading fashion and lifestyle destination. Gift a Myntra Gift Card to let your loved ones choose from the latest trends.',
    image: 'https://www.google.com/s2/favicons?domain=myntra.com&sz=128',
    category: 'Shopping',
    website: 'myntra.com',
    termsAndConditions: '1. This Gift Card is valid for 1 year from the date of issue. 2. Redeemable only on Myntra.com.',
    denominations: [500, 1000, 2000, 3000, 5000]
  },
  {
    brandName: 'Shoppers Stop',
    description: 'Shoppers Stop offers a wide range of fashion apparel, accessories, perfumes, and home decor from top international and Indian brands.',
    image: 'https://www.google.com/s2/favicons?domain=shoppersstop.com&sz=128',
    category: 'Shopping',
    website: 'shoppersstop.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Shoppers Stop stores and online.',
    denominations: [500, 1000, 2000, 5000]
  },
  {
    brandName: 'Lifestyle',
    description: 'Lifestyle is a vibrant and youthful brand that offers the best in fashion and accessories for men, women, and kids.',
    image: 'https://www.google.com/s2/favicons?domain=lifestylestores.com&sz=128',
    category: 'Shopping',
    website: 'lifestylestores.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable at Lifestyle stores across India.',
    denominations: [500, 1000, 2000, 5000]
  },
  {
    brandName: 'BigBasket',
    description: 'BigBasket is India\'s largest online food and grocery store. Gift a BigBasket card for convenience and quality.',
    image: 'https://www.google.com/s2/favicons?domain=bigbasket.com&sz=128',
    category: 'Shopping',
    website: 'bigbasket.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on BigBasket website and app.',
    denominations: [500, 1000, 2000]
  },
  {
    brandName: 'Decathlon',
    description: 'Decathlon offers affordable sportswear, shoes, and sports equipment for over 70 sports.',
    image: 'https://www.google.com/s2/favicons?domain=decathlon.in&sz=128',
    category: 'Shopping',
    website: 'decathlon.in',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Decathlon stores and online.',
    denominations: [500, 1000, 2000, 5000]
  },
  {
    brandName: 'Pantaloons',
    description: 'Pantaloons is a playground for fashion lovers, offering fresh fashion and trends.',
    image: 'https://www.google.com/s2/favicons?domain=pantaloons.com&sz=128',
    category: 'Shopping',
    website: 'pantaloons.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable at Pantaloons stores.',
    denominations: [500, 1000, 2000]
  },
  {
    brandName: 'H&M',
    description: 'H&M offers fashion and quality at the best price in a sustainable way.',
    image: 'https://www.google.com/s2/favicons?domain=hm.com&sz=128',
    category: 'Shopping',
    website: 'hm.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at H&M stores in India.',
    denominations: [1000, 2000, 5000]
  },
  {
    brandName: 'Levi\'s',
    description: 'Levi\'s is the epitome of classic American style and effortless cool.',
    image: 'https://www.google.com/s2/favicons?domain=levi.in&sz=128',
    category: 'Shopping',
    website: 'levi.in',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable at exclusive Levi\'s stores.',
    denominations: [1000, 2000, 3000]
  },
  {
    brandName: 'Titan',
    description: 'Titan offers a wide range of watches, accessories, and eyewear.',
    image: 'https://www.google.com/s2/favicons?domain=titan.co.in&sz=128',
    category: 'Shopping',
    website: 'titan.co.in',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable at World of Titan stores.',
    denominations: [1000, 2000, 5000]
  },

  // Food & Dining
  {
    brandName: 'Swiggy',
    description: 'Swiggy is India\'s leading on-demand delivery platform. Order food from your favorite restaurants.',
    image: 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128',
    category: 'Food & Dining',
    website: 'swiggy.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on Swiggy app (Food ordering).',
    denominations: [250, 500, 1000, 2000]
  },
  {
    brandName: 'Zomato',
    description: 'Discover the best food & drinks in your city. Order online or dine out.',
    image: 'https://www.google.com/s2/favicons?domain=zomato.com&sz=128',
    category: 'Food & Dining',
    website: 'zomato.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on Zomato app.',
    denominations: [250, 500, 1000, 2000]
  },
  {
    brandName: 'Domino\'s Pizza',
    description: 'Enjoy hot and fresh pizzas from Domino\'s. The world\'s leading pizza delivery company.',
    image: 'https://www.google.com/s2/favicons?domain=dominos.co.in&sz=128',
    category: 'Food & Dining',
    website: 'dominos.co.in',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable on Domino\'s website and app.',
    denominations: [250, 500, 1000]
  },
  {
    brandName: 'Pizza Hut',
    description: 'Pizza Hut offers a wide variety of pizzas, pasta, and sides.',
    image: 'https://www.google.com/s2/favicons?domain=pizzahut.co.in&sz=128',
    category: 'Food & Dining',
    website: 'pizzahut.co.in',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable at Pizza Hut restaurants.',
    denominations: [500, 1000]
  },
  {
    brandName: 'KFC',
    description: 'Enjoy the world-famous fried chicken from KFC.',
    image: 'https://www.google.com/s2/favicons?domain=kfc.co.in&sz=128',
    category: 'Food & Dining',
    website: 'kfc.co.in',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable at KFC restaurants.',
    denominations: [500, 1000]
  },
  {
    brandName: 'Starbucks',
    description: 'Treat yourself or a friend to the finest coffee and snacks at Starbucks.',
    image: 'https://www.google.com/s2/favicons?domain=starbucks.in&sz=128',
    category: 'Food & Dining',
    website: 'starbucks.in',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable at Starbucks stores in India.',
    denominations: [500, 1000, 2000]
  },
  {
    brandName: 'Barbeque Nation',
    description: 'Experience the joy of grilling at your table with Barbeque Nation.',
    image: 'https://www.google.com/s2/favicons?domain=barbequenation.com&sz=128',
    category: 'Food & Dining',
    website: 'barbequenation.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Barbeque Nation outlets.',
    denominations: [1000, 2000]
  },

  // Entertainment
  {
    brandName: 'BookMyShow',
    description: 'Book tickets for movies, events, plays, sports, and activities happening in your city.',
    image: 'https://www.google.com/s2/favicons?domain=bookmyshow.com&sz=128',
    category: 'Entertainment',
    website: 'bookmyshow.com',
    termsAndConditions: '1. Valid for 6 months. 2. Redeemable on BookMyShow website and app.',
    denominations: [250, 500, 1000]
  },
  {
    brandName: 'PVR Cinemas',
    description: 'Watch the latest blockbuster movies at PVR Cinemas, India\'s largest cinema chain.',
    image: 'https://www.google.com/s2/favicons?domain=pvrcinemas.com&sz=128',
    category: 'Entertainment',
    website: 'pvrcinemas.com',
    termsAndConditions: '1. Valid for 3 months. 2. Redeemable at PVR Cinemas box office and website.',
    denominations: [500, 1000]
  },

  // Travel
  {
    brandName: 'MakeMyTrip',
    description: 'Plan your travel with MakeMyTrip. Book flights, hotels, holiday packages, and more.',
    image: 'https://www.google.com/s2/favicons?domain=makemytrip.com&sz=128',
    category: 'Travel',
    website: 'makemytrip.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on MakeMyTrip website and app.',
    denominations: [1000, 2000, 5000, 10000]
  },
  {
    brandName: 'Uber',
    description: 'Get a reliable ride in minutes with the Uber app.',
    image: 'https://www.google.com/s2/favicons?domain=uber.com&sz=128',
    category: 'Travel',
    website: 'uber.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on Uber app.',
    denominations: [250, 500, 1000]
  },
  {
    brandName: 'Ola',
    description: 'Book a cab in seconds with Ola, India\'s most popular cab booking app.',
    image: 'https://www.google.com/s2/favicons?domain=olacabs.com&sz=128',
    category: 'Travel',
    website: 'olacabs.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on Ola app.',
    denominations: [250, 500, 1000]
  },
  {
    brandName: 'Yatra',
    description: 'Yatra.com is a leading online travel company in India.',
    image: 'https://www.google.com/s2/favicons?domain=yatra.com&sz=128',
    category: 'Travel',
    website: 'yatra.com',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable on Yatra.com.',
    denominations: [1000, 2000, 5000]
  },

  // Health & Beauty
  {
    brandName: 'Nykaa',
    description: 'Nykaa is your one-stop destination for beauty and wellness products.',
    image: 'https://www.google.com/s2/favicons?domain=nykaa.com&sz=128',
    category: 'Health & Beauty',
    website: 'nykaa.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable on Nykaa.com and app.',
    denominations: [500, 1000, 2000, 5000]
  },
  {
    brandName: 'The Body Shop',
    description: 'The Body Shop offers high-quality, naturally-inspired skincare, hair care, and make-up.',
    image: 'https://www.google.com/s2/favicons?domain=thebodyshop.in&sz=128',
    category: 'Health & Beauty',
    website: 'thebodyshop.in',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at The Body Shop stores.',
    denominations: [500, 1000, 2000]
  },
  {
    brandName: 'Kama Ayurveda',
    description: 'Authentic Ayurvedic products for skin and hair care.',
    image: 'https://www.google.com/s2/favicons?domain=kamaayurveda.com&sz=128',
    category: 'Health & Beauty',
    website: 'kamaayurveda.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Kama Ayurveda stores and online.',
    denominations: [1000, 2000, 5000]
  },

  // Electronics
  {
    brandName: 'Croma',
    description: 'Croma is India\'s first large format specialist electronics retail store.',
    image: 'https://www.google.com/s2/favicons?domain=croma.com&sz=128',
    category: 'Electronics',
    website: 'croma.com',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Croma stores and online.',
    denominations: [1000, 2000, 5000, 10000]
  },
  {
    brandName: 'Reliance Digital',
    description: 'Reliance Digital offers a wide range of electronics, gadgets, and home appliances.',
    image: 'https://www.google.com/s2/favicons?domain=reliancedigital.in&sz=128',
    category: 'Electronics',
    website: 'reliancedigital.in',
    termsAndConditions: '1. Valid for 1 year. 2. Redeemable at Reliance Digital stores.',
    denominations: [1000, 2000, 5000, 10000]
  },

  // Other (Jewellery)
  {
    brandName: 'Tanishq',
    description: 'Tanishq offers the finest range of gold and diamond jewellery.',
    image: 'https://www.google.com/s2/favicons?domain=tanishq.co.in&sz=128',
    category: 'Other',
    website: 'tanishq.co.in',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable at Tanishq stores.',
    denominations: [1000, 2000, 5000, 10000]
  },
  {
    brandName: 'Kalyan Jewellers',
    description: 'Kalyan Jewellers offers a wide array of traditional and contemporary jewellery designs.',
    image: 'https://www.google.com/s2/favicons?domain=kalyanjewellers.net&sz=128',
    category: 'Other',
    website: 'kalyanjewellers.net',
    termsAndConditions: '1. Valid for 12 months. 2. Redeemable at Kalyan Jewellers showrooms.',
    denominations: [1000, 2000, 5000, 10000]
  }
];

const seedGiftVouchers = async () => {
  try {
    console.log('Starting Gift Voucher Seeding...');
    
    // Find admin user to associate as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('No admin user found. Please run seedAdmin.js or create an admin user first.');
    }
    console.log(`Using admin user: ${adminUser.name} (${adminUser._id})`);

    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const voucher of voucherData) {
      try {
        // Check if voucher already exists
        let brandVoucher = await BrandVoucher.findOne({ brandName: voucher.brandName });
        
        if (brandVoucher) {
          console.log(`Voucher ${voucher.brandName} exists. Updating details...`);
          brandVoucher.description = voucher.description;
          brandVoucher.image = voucher.image;
          brandVoucher.category = voucher.category;
          brandVoucher.website = voucher.website;
          brandVoucher.termsAndConditions = voucher.termsAndConditions;
          // preserve createdBy if needed, or update it? Keep original creator.
          await brandVoucher.save();
          // skippedCount++; // No longer skipping
          addedCount++; // Counting as processed/updated
        } else {
          // Create new BrandVoucher
          brandVoucher = new BrandVoucher({
            brandName: voucher.brandName,
            description: voucher.description,
            image: voucher.image,
            category: voucher.category,
            termsAndConditions: voucher.termsAndConditions,
            validityPeriod: 365,
            createdBy: adminUser._id,
            isActive: true
          });
          await brandVoucher.save();
          console.log(`Created BrandVoucher: ${voucher.brandName}`);
          addedCount++;
        }

        // Create Denominations
        for (const denomAmount of voucher.denominations) {
            // Check if denomination exists
            const existingDenom = await VoucherDenomination.findOne({
                brandVoucher: brandVoucher._id,
                denomination: denomAmount
            });

            if (!existingDenom) {
                const denomination = new VoucherDenomination({
                    brandVoucher: brandVoucher._id,
                    denomination: denomAmount,
                    discountPercentage: Math.floor(Math.random() * 5), // Random discount 0-4%
                    maxQuantityPerUser: 5,
                    totalAvailableQuantity: 1000,
                    createdBy: adminUser._id,
                    isActive: true
                });
                await denomination.save();
                // console.log(`  Added denomination: ₹${denomAmount}`);
            }
        }

      } catch (err) {
        console.error(`Error processing ${voucher.brandName}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n==========================================');
    console.log('SEEDING SUMMARY');
    console.log('==========================================');
    console.log(`Brands Added: ${addedCount}`);
    console.log(`Brands Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('==========================================');
    
    const totalBrands = await BrandVoucher.countDocuments();
    const totalDenoms = await VoucherDenomination.countDocuments();
    console.log(`Total Brands in DB: ${totalBrands}`);
    console.log(`Total Denominations in DB: ${totalDenoms}`);

  } catch (error) {
    console.error('Fatal error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Execute if run directly
if (require.main === module) {
  connectDB().then(seedGiftVouchers);
}

module.exports = { seedGiftVouchers };
