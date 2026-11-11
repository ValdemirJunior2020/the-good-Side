/** Recipe publisher directory only. No crawling or copying is enabled. */
export type RecipeSource={name:string;homepage:string};
export const RECIPE_SOURCES:readonly RecipeSource[]=[
  {
    "name": "Allrecipes",
    "homepage": "https://www.allrecipes.com"
  },
  {
    "name": "BBC Good Food",
    "homepage": "https://www.bbcgoodfood.com"
  },
  {
    "name": "RecipeTin Eats",
    "homepage": "https://www.recipetineats.com"
  },
  {
    "name": "Serious Eats",
    "homepage": "https://www.seriouseats.com"
  },
  {
    "name": "Epicurious",
    "homepage": "https://www.epicurious.com"
  },
  {
    "name": "The Woks of Life",
    "homepage": "https://thewoksoflife.com"
  },
  {
    "name": "Maangchi",
    "homepage": "https://www.maangchi.com"
  },
  {
    "name": "Budget Bytes",
    "homepage": "https://www.budgetbytes.com"
  },
  {
    "name": "Jamie Oliver Recipes",
    "homepage": "https://www.jamieoliver.com/recipes"
  },
  {
    "name": "196 Flavors",
    "homepage": "https://www.196flavors.com"
  },
  {
    "name": "King Arthur Baking",
    "homepage": "https://www.kingarthurbaking.com"
  },
  {
    "name": "Sally's Baking",
    "homepage": "https://sallysbakingaddiction.com"
  },
  {
    "name": "Just One Cookbook",
    "homepage": "https://www.justonecookbook.com"
  },
  {
    "name": "Love and Lemons",
    "homepage": "https://www.loveandlemons.com"
  },
  {
    "name": "Cookie and Kate",
    "homepage": "https://cookieandkate.com"
  }
] as const;
