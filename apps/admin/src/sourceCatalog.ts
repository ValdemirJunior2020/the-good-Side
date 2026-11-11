/** Discovery candidates only. Do not scrape or auto-publish until individually verified. 
 * This registry has no paid RSS dependency and does not alter the live import worker.
 */
export type SourceCandidate={name:string;homepage:string;feedUrl?:string};
export const SOURCE_CATALOG:readonly SourceCandidate[]=[
  {
    "name": "The Better India",
    "homepage": "https://thebetterindia.com/"
  },
  {
    "name": "Upworthy",
    "homepage": "https://www.upworthy.com/"
  },
  {
    "name": "YES! Magazine",
    "homepage": "https://www.yesmagazine.org/"
  },
  {
    "name": "Good News Network",
    "homepage": "https://www.goodnewsnetwork.org/",
    "feedUrl": "https://www.goodnewsnetwork.org/feed/"
  },
  {
    "name": "Goodnet",
    "homepage": "https://www.goodnet.org/"
  },
  {
    "name": "TODAY Good News",
    "homepage": "https://www.today.com/news/good-news"
  },
  {
    "name": "BBC Uplifting Stories",
    "homepage": "https://www.bbc.com/news/topics/cx2pk70323et"
  },
  {
    "name": "Jane Goodall Good for All News",
    "homepage": "https://news.janegoodall.org/"
  },
  {
    "name": "ABC Australia Good News",
    "homepage": "https://www.abc.net.au/news/good-news"
  },
  {
    "name": "Positive News",
    "homepage": "https://www.positive.news/"
  },
  {
    "name": "DailyGood",
    "homepage": "https://www.dailygood.org/features"
  },
  {
    "name": "SA Good News",
    "homepage": "https://www.sagoodnews.co.za/"
  },
  {
    "name": "WFMZ Good News",
    "homepage": "https://www.wfmz.com/news/good-news/"
  },
  {
    "name": "The Optimist Daily",
    "homepage": "https://www.optimistdaily.com/"
  },
  {
    "name": "Reasons to Be Cheerful",
    "homepage": "https://reasonstobecheerful.world/"
  },
  {
    "name": "Good Good Good",
    "homepage": "https://www.goodgoodgood.co/"
  },
  {
    "name": "SunnySkyz",
    "homepage": "https://www.sunnyskyz.com/"
  },
  {
    "name": "Good Black News",
    "homepage": "https://goodblacknews.org/"
  },
  {
    "name": "Good News Pilipinas",
    "homepage": "https://goodnewspilipinas.com/"
  },
  {
    "name": "The New Daily Good News",
    "homepage": "https://www.thenewdaily.com.au/news/good-news"
  },
  {
    "name": "Life Beyond Numbers",
    "homepage": "https://lifebeyondnumbers.com/"
  },
  {
    "name": "Daryn Kagan",
    "homepage": "https://darynkagan.com/"
  },
  {
    "name": "Good News Shared",
    "homepage": "https://goodnewsshared.com/"
  },
  {
    "name": "Only Good News Daily",
    "homepage": "https://www.onlygoodnewsdaily.com/"
  },
  {
    "name": "The Good News Movement",
    "homepage": "https://www.thegoodnewsmovement.com/"
  },
  {
    "name": "Good News Magazine",
    "homepage": "https://goodnewsmag.org/latest-articles/"
  },
  {
    "name": "Good News Florida",
    "homepage": "https://www.goodnewsfl.org/topic/news/"
  },
  {
    "name": "GoodNews.eu",
    "homepage": "https://goodnews.eu/en/"
  },
  {
    "name": "Global Positive News Network",
    "homepage": "https://www.globalpositivenewsnetwork.com/blog/"
  },
  {
    "name": "The Good News Hub",
    "homepage": "https://thegoodnewshub.com/"
  },
  {
    "name": "Good News Daily",
    "homepage": "https://the-goodnews-daily.com/"
  }
] as const;
