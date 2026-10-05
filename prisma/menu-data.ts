export type SeedItem = {
  name: string;
  slug: string;
  description: string;
  price: number;
  isFeatured?: boolean;
  isSpicy?: boolean;
  isVeg?: boolean;
  calories?: number;
  prepMinutes?: number;
  rating?: number;
  tags?: string[];
};

export type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  tagline: string;
  items: SeedItem[];
};

export const menu: SeedCategory[] = [
  {
    name: "Starters",
    slug: "starters",
    icon: "Soup",
    tagline: "Small plates to begin",
    items: [
      {
        name: "Truffle Parmesan Fries",
        slug: "truffle-parmesan-fries",
        description:
          "Hand-cut potatoes tossed in truffle oil, aged parmesan and torn parsley. Served with smoked garlic aioli.",
        price: 895,
        isFeatured: true,
        isVeg: true,
        calories: 520,
        rating: 4.8,
        prepMinutes: 12,
        tags: ["signature", "vegetarian"],
      },
      {
        name: "Charred Corn Ribs",
        slug: "charred-corn-ribs",
        description:
          "Baby corn grilled hard for a smokey bite, finished with lime crema, cotija and a pinch of chilli.",
        price: 795,
        isSpicy: true,
        isVeg: true,
        calories: 310,
        rating: 4.6,
        prepMinutes: 14,
        tags: ["vegetarian", "spicy"],
      },
      {
        name: "Crispy Chicken Wings",
        slug: "crispy-chicken-wings",
        description:
          "Buttermilk-brined wings fried twice for shatter-crisp skin, glazed in sticky gochujang and sesame.",
        price: 1150,
        isSpicy: true,
        isVeg: false,
        calories: 640,
        rating: 4.9,
        prepMinutes: 18,
        tags: ["spicy", "popular"],
      },
      {
        name: "Burrata & Heirloom Tomato",
        slug: "burrata-heirloom-tomato",
        description:
          "Creamy burrata with vine-ripened tomatoes, basil oil, aged balsamic and torn sourdough.",
        price: 1295,
        isFeatured: true,
        isVeg: true,
        calories: 420,
        rating: 4.7,
        prepMinutes: 10,
        tags: ["vegetarian", "fresh"],
      },
      {
        name: "Crispy Calamari",
        slug: "crispy-calamari",
        description:
          "Lightly dusted squid rings with lemon, smoked paprika and a squeeze of charred lime.",
        price: 1095,
        isVeg: false,
        calories: 480,
        rating: 4.5,
        prepMinutes: 15,
        tags: ["seafood"],
      },
    ],
  },
  {
    name: "Burgers & Sandwiches",
    slug: "burgers-sandwiches",
    icon: "Sandwich",
    tagline: "Handheld, stacked high",
    items: [
      {
        name: "FeastCraft Smash Burger",
        slug: "feastcraft-smash-burger",
        description:
          "Double smashed beef patty, molten cheddar, house pickles and FeastCraft sauce on a milk bun.",
        price: 1495,
        isFeatured: true,
        isVeg: false,
        calories: 880,
        rating: 4.9,
        prepMinutes: 16,
        tags: ["signature", "popular"],
      },
      {
        name: "Crispy Chicken Burger",
        slug: "crispy-chicken-burger",
        description:
          "Buttermilk thigh, shredded lettuce, pickles and chipotle mayo in a toasted brioche bun.",
        price: 1345,
        isVeg: false,
        calories: 790,
        rating: 4.7,
        prepMinutes: 16,
        tags: ["popular"],
      },
      {
        name: "Mushroom & Swiss Melt",
        slug: "mushroom-swiss-melt",
        description:
          "Garlic butter mushrooms, melted Swiss, rocket and caramelised onion on rye.",
        price: 1395,
        isVeg: true,
        calories: 720,
        rating: 4.6,
        prepMinutes: 18,
        tags: ["vegetarian"],
      },
      {
        name: "Spicy Chicken Tacos",
        slug: "spicy-chicken-tacos",
        description:
          "Three corn tortillas, ancho-marinated chicken, slaw, avocado crema and pickled onion.",
        price: 1245,
        isSpicy: true,
        isVeg: false,
        calories: 690,
        rating: 4.7,
        prepMinutes: 17,
        tags: ["spicy"],
      },
    ],
  },
  {
    name: "Mains",
    slug: "mains",
    icon: "Beef",
    tagline: "The centre of the table",
    items: [
      {
        name: "Miso Glazed Salmon",
        slug: "miso-glazed-salmon",
        description:
          "Fillet roasted until lacquered, with ginger rice, charred tenderstem and miso beurre blanc.",
        price: 2495,
        isFeatured: true,
        isVeg: false,
        calories: 740,
        rating: 4.9,
        prepMinutes: 25,
        tags: ["signature", "gluten-free"],
      },
      {
        name: "Slow Braised Short Rib",
        slug: "slow-braised-short-rib",
        description:
          "Twelve-hour beef short rib, red wine reduction, potato gratin and burnt onion jus.",
        price: 2895,
        isVeg: false,
        calories: 1050,
        rating: 5,
        prepMinutes: 30,
        tags: ["signature", "chef's pick"],
      },
      {
        name: "Thai Green Curry",
        slug: "thai-green-curry",
        description:
          "Coconut green curry with chicken, Thai basil, bamboo shoot and jasmine rice.",
        price: 1795,
        isSpicy: true,
        isVeg: false,
        calories: 810,
        rating: 4.7,
        prepMinutes: 22,
        tags: ["spicy", "gluten-free"],
      },
      {
        name: "Wild Mushroom Risotto",
        slug: "wild-mushroom-risotto",
        description:
          "Carnaroli rice cooked to cream with porcini, aged parmesan and truffle oil.",
        price: 1895,
        isFeatured: true,
        isVeg: true,
        calories: 720,
        rating: 4.8,
        prepMinutes: 28,
        tags: ["vegetarian", "comfort"],
      },
      {
        name: "Chargrilled Chicken Steak",
        slug: "chargrilled-chicken-steak",
        description:
          "Herb-brined chicken thigh, saffron potatoes, watercress and a sharp lemon dressing.",
        price: 2095,
        isVeg: false,
        calories: 690,
        rating: 4.6,
        prepMinutes: 24,
        tags: ["high-protein", "gluten-free"],
      },
    ],
  },
  {
    name: "Pizza & Pasta",
    slug: "pizza-pasta",
    icon: "Pizza",
    tagline: "Wood-fired and handmade",
    items: [
      {
        name: "Truffle Mushroom Pizza",
        slug: "truffle-mushroom-pizza",
        description:
          "Wood-fired sourdough base, fontina, wild mushrooms, thyme and truffle honey.",
        price: 1695,
        isFeatured: true,
        isVeg: true,
        calories: 860,
        rating: 4.9,
        prepMinutes: 18,
        tags: ["vegetarian", "wood-fired"],
      },
      {
        name: "Spicy Pepperoni Pizza",
        slug: "spicy-pepperoni-pizza",
        description:
          "Cup-and-char pepperoni, mozzarella, chilli honey and oregano on a blistered base.",
        price: 1595,
        isSpicy: true,
        isVeg: false,
        calories: 910,
        rating: 4.8,
        prepMinutes: 18,
        tags: ["wood-fired", "popular"],
      },
      {
        name: "Spicy Vodka Rigatoni",
        slug: "spicy-vodka-rigatoni",
        description:
          "Rigatoni in a San Marzano vodka cream with chilli, parmesan and torn basil.",
        price: 1495,
        isSpicy: true,
        isVeg: true,
        calories: 780,
        rating: 4.7,
        prepMinutes: 17,
        tags: ["vegetarian", "comfort"],
      },
      {
        name: "Carbonara",
        slug: "carbonara",
        description:
          "Guanciale, egg yolk, pecorino romano and cracked black pepper. Finished off the heat.",
        price: 1550,
        isVeg: false,
        calories: 820,
        rating: 4.8,
        prepMinutes: 16,
        tags: ["classic"],
      },
    ],
  },
  {
    name: "Bowls & Salads",
    slug: "bowls-salads",
    icon: "Salad",
    tagline: "Fresh, bright and balanced",
    items: [
      {
        name: "Harvest Grain Bowl",
        slug: "harvest-grain-bowl",
        description:
          "Freekeh, roast squash, pomegranate, avocado, herbs and a tahini honey dressing.",
        price: 1395,
        isFeatured: true,
        isVeg: true,
        calories: 540,
        rating: 4.8,
        prepMinutes: 12,
        tags: ["vegetarian", "healthy"],
      },
      {
        name: "Grilled Chicken Caesar",
        slug: "grilled-chicken-caesar",
        description:
          "Cos lettuce, charred chicken, sourdough croutons, parmesan and a proper caesar dressing.",
        price: 1295,
        isVeg: false,
        calories: 610,
        rating: 4.6,
        prepMinutes: 13,
        tags: ["high-protein"],
      },
      {
        name: "Prawn & Avocado Salad",
        slug: "prawn-avocado-salad",
        description:
          "Chilled prawns, avocado, little gem, cucumber and chilli-lime dressing.",
        price: 1495,
        isSpicy: true,
        isVeg: false,
        calories: 380,
        rating: 4.7,
        prepMinutes: 12,
        tags: ["fresh", "gluten-free"],
      },
      {
        name: "Roast Cauliflower Bowl",
        slug: "roast-cauliflower-bowl",
        description:
          "Whole roast cauliflower, quinoa, coconut yoghurt, pickle and green chilli dressing.",
        price: 1245,
        isSpicy: true,
        isVeg: true,
        calories: 470,
        rating: 4.5,
        prepMinutes: 14,
        tags: ["vegetarian", "vegan"],
      },
    ],
  },
  {
    name: "Sides",
    slug: "sides",
    icon: "CookingPot",
    tagline: "Finishers for your main",
    items: [
      {
        name: "Shoestring Fries",
        slug: "shoestring-fries",
        description: "Triple-cooked, sea salt, served with roasted garlic ketchup.",
        price: 495,
        isVeg: true,
        calories: 390,
        rating: 4.7,
        prepMinutes: 8,
        tags: ["vegetarian", "classic"],
      },
      {
        name: "Garlic Butter Greens",
        slug: "garlic-butter-greens",
        description: "Blistered greens, roasted garlic butter, lemon and toasted almond.",
        price: 595,
        isVeg: true,
        calories: 210,
        rating: 4.5,
        prepMinutes: 9,
        tags: ["vegetarian", "healthy"],
      },
      {
        name: "Loaded Cheese Fries",
        slug: "loaded-cheese-fries",
        description:
          "Shoestring fries under molten cheese sauce, jalapeño, spring onion and smoky chilli.",
        price: 895,
        isSpicy: true,
        isVeg: true,
        calories: 620,
        rating: 4.8,
        prepMinutes: 11,
        tags: ["vegetarian", "popular"],
      },
      {
        name: "Spicy Buffalo Wings",
        slug: "spicy-buffalo-wings",
        description: "Crisp wings tossed in buffalo butter with blue cheese dip.",
        price: 1095,
        isSpicy: true,
        isVeg: false,
        calories: 580,
        rating: 4.6,
        prepMinutes: 15,
        tags: ["spicy"],
      },
    ],
  },
  {
    name: "Desserts",
    slug: "desserts",
    icon: "CakeSlice",
    tagline: "A little something sweet",
    items: [
      {
        name: "Molten Chocolate Torte",
        slug: "molten-chocolate-torte",
        description:
          "Dark 70% chocolate torte with a liquid centre, vanilla gelato and sea salt.",
        price: 995,
        isFeatured: true,
        isVeg: true,
        calories: 560,
        rating: 5,
        prepMinutes: 12,
        tags: ["vegetarian", "signature"],
      },
      {
        name: "Basque Cheesecake",
        slug: "basque-cheesecake",
        description:
          "Burnt-topped Basque cheesecake with macerated blackberries and crème fraîche.",
        price: 949,
        isVeg: true,
        calories: 610,
        rating: 4.9,
        prepMinutes: 10,
        tags: ["vegetarian", "popular"],
      },
      {
        name: "Pistachio Tiramisu",
        slug: "pistachio-tiramisu",
        description:
          "Espresso-soaked savoiardi, mascarpone cream and crushed Sicilian pistachio.",
        price: 899,
        isVeg: true,
        calories: 490,
        rating: 4.7,
        prepMinutes: 8,
        tags: ["vegetarian"],
      },
      {
        name: "Salted Caramel Cheesecake Jar",
        slug: "salted-caramel-cheesecake-jar",
        description:
          "Vanilla bean cheesecake layered with salted caramel and toasted hazelnut praline.",
        price: 749,
        isVeg: true,
        calories: 440,
        rating: 4.6,
        prepMinutes: 6,
        tags: ["vegetarian"],
      },
    ],
  },
  {
    name: "Beverages",
    slug: "beverages",
    icon: "CupSoda",
    tagline: "Pours and sips",
    items: [
      {
        name: "Salted Caramel Cold Brew",
        slug: "salted-caramel-cold-brew",
        description:
          "18-hour cold brew with salted caramel cream and a dusting of cocoa.",
        price: 595,
        isVeg: true,
        calories: 220,
        rating: 4.8,
        prepMinutes: 4,
        tags: ["vegan", "caffeine"],
      },
      {
        name: "Blood Orange Soda",
        slug: "blood-orange-soda",
        description: "House blood orange cordial topped with sparkling water and rosemary.",
        price: 545,
        isVeg: true,
        calories: 90,
        rating: 4.7,
        prepMinutes: 4,
        tags: ["vegan", "refreshing"],
      },
      {
        name: "Mango Lassi",
        slug: "mango-lassi",
        description: "Alphonso mango blended with thick yoghurt and a pinch of cardamom.",
        price: 625,
        isVeg: true,
        calories: 250,
        rating: 4.6,
        prepMinutes: 5,
        tags: ["vegetarian", "signature"],
      },
      {
        name: "Fresh Lemonade",
        slug: "fresh-lemonade",
        description: "Pressed lemon, cane sugar and a splash of soda. Served over crushed ice.",
        price: 475,
        isVeg: true,
        calories: 130,
        rating: 4.5,
        prepMinutes: 4,
        tags: ["vegan", "refreshing"],
      },
    ],
  },
];

export const promoCodes = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    discountType: "PERCENT",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: 1500,
  },
  {
    code: "FEAST20",
    description: "20% off orders over $45",
    discountType: "PERCENT",
    discountValue: 20,
    minOrderAmount: 4500,
    maxDiscount: 3000,
  },
  {
    code: "FREEDELIVERY",
    description: "$5 off — delivery on us",
    discountType: "FIXED",
    discountValue: 500,
    minOrderAmount: 2000,
    maxDiscount: null,
  },
  {
    code: "CHEFS25",
    description: "$25 off orders over $120",
    discountType: "FIXED",
    discountValue: 2500,
    minOrderAmount: 12000,
    maxDiscount: null,
  },
];
