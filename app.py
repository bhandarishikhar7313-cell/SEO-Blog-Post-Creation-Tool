import os, json, time, re, requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from pytrends.request import TrendReq
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

load_dotenv()
app = Flask(__name__)
CORS(app)

ANTHROPIC_API_KEY  = os.getenv("ANTHROPIC_API_KEY", "")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CLIENT_SECRET_FILE = os.path.join(
    BASE_DIR,
    "client_secret.json"
)

def scrape_amazon_bestsellers(category="electronics"):
    """Scrape Amazon bestsellers (or return demo data if blocked)"""

    urls = {
        "electronics": "https://www.amazon.in/gp/bestsellers/electronics/",
        "books": "https://www.amazon.in/gp/bestsellers/books/",
        "fashion": "https://www.amazon.in/gp/bestsellers/apparel/",
        "home": "https://www.amazon.in/gp/bestsellers/kitchen/",
    }

    url = urls.get(category, urls["electronics"])

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15)

        if resp.status_code == 200:

            soup = BeautifulSoup(resp.content, "html.parser")

            products = []

            selectors = [
                "div[id^='p13n-asin-index']",
                ".zg-grid-general-faceout",
                ".p13n-sc-uncoverable-faceout"
            ]

            items = []

            for selector in selectors:
                items = soup.select(selector)

                if items:
                    break

            for item in items[:8]:

                title = (
                    item.select_one("._cDEzb_p13n-sc-css-line-clamp-3_g3dy1")
                    or item.select_one("._cDEzb_p13n-sc-css-line-clamp-2_EWgCb")
                    or item.select_one("img")
                )

                price = item.select_one(".p13n-sc-price")

                rating = item.select_one("span.a-icon-alt")

                img = item.select_one("img")

                title_text = ""

                if title:
                    if title.name == "img":
                        title_text = title.get("alt", "").strip()
                    else:
                        title_text = title.get_text(strip=True)

                if title_text:

                    products.append({
                        "title": title_text,
                        "price": price.get_text(strip=True) if price else "N/A",
                        "rating": (
                            rating.get_text(strip=True).split()[0]
                            if rating else "4.0"
                        ),
                        "image": (
                            img.get("src", "")
                            if img else ""
                        ),
                        "source": "Amazon Bestsellers"
                    })

            if products:
                return products

    except Exception as e:
        print(f"Amazon scrape failed: {e}")

    # Demo fallback
    demo = {
        "electronics": [
            {
                "title": "boAt Airdopes 141 TWS Earbuds with 42H Playtime",
                "price": "₹1,299",
                "rating": "4.1",
                "image": "",
                "source": "Amazon Bestsellers"
            },
            {
                "title": "Redmi 12 5G Smartphone 4GB+128GB",
                "price": "₹12,499",
                "rating": "4.3",
                "image": "",
                "source": "Amazon Bestsellers"
            },
            {
                "title": "Anker 65W USB-C Fast Charger with GaN Technology",
                "price": "₹2,499",
                "rating": "4.5",
                "image": "",
                "source": "Amazon Bestsellers"
            },
            {
                "title": "HP Wireless Mouse and Keyboard Combo",
                "price": "₹1,799",
                "rating": "4.2",
                "image": "",
                "source": "Amazon Bestsellers"
            }
        ],
        "books": [
            {
                "title": "Atomic Habits by James Clear",
                "price": "₹399",
                "rating": "4.7",
                "image": "",
                "source": "Amazon Bestsellers"
            },
            {
                "title": "Rich Dad Poor Dad by Robert Kiyosaki",
                "price": "₹299",
                "rating": "4.6",
                "image": "",
                "source": "Amazon Bestsellers"
            }
        ],
        "home": [
            {
                "title": "Prestige Iris 750-Watt Mixer Grinder",
                "price": "₹2,295",
                "rating": "4.3",
                "image": "",
                "source": "Amazon Bestsellers"
            },
            {
                "title": "Milton Thermosteel Flip Lid Flask 500ml",
                "price": "₹499",
                "rating": "4.4",
                "image": "",
                "source": "Amazon Bestsellers"
            }
        ]
    }

    return demo.get(category, demo["electronics"])

def generate_keywords(product_title):
    try:
        pytrends = TrendReq(hl='en-US', tz=330)

        pytrends.build_payload(
            [product_title],
            cat=0,
            timeframe='today 12-m'
        )

        related = pytrends.related_queries()

        keywords = []

        if (
            product_title in related
            and related[product_title]
            and related[product_title]["top"] is not None
        ):
            top_df = related[product_title]["top"]

            keywords = (
                top_df["query"]
                .head(4)
                .tolist()
            )

        if len(keywords) >= 4:
            return keywords[:4]

    except Exception:
        pass

    words = product_title.split()

    return [
        product_title,
        f"best {words[0]}",
        f"{words[0]} review",
        f"buy {words[0]} online"
    ]

def generate_blog_post(product, keywords):

    return {
        "title": f"Why {product['title']} is Trending in 2026",

        "content": f"""
Looking for the best {keywords[0]} this year? The {product['title']} is becoming one of the most popular choices among buyers.

With a price of {product.get('price', 'N/A')} and a rating of {product.get('rating', '4.0')} stars, it delivers excellent value for money. Whether you are searching for {keywords[1]} or comparing products before making a purchase, this product stands out because of its reliability and performance.

Many customers have highlighted its quality, durability, and ease of use. As a {keywords[2]}, it continues to receive positive feedback from users across different categories.

If you are planning to {keywords[3]}, this product deserves a place on your shortlist. It combines affordability, strong customer reviews, and trusted performance.

Check the latest offers and availability today to see why it remains one of the most recommended products in its category.
""".strip(),

        "meta_description":
            f"{product['title']} review. Discover features, pricing, ratings and why it is one of the best {keywords[0]} choices in 2026.",

        "tags": keywords
    }
def publish_to_wordpress(title, content, tags):

    try:

        service = authenticate_blogger()

        blog_id = os.getenv("BLOGGER_BLOG_ID")

        print("Authenticated Successfully")
        print("Blog ID:", blog_id)

        post = {
            "kind": "blogger#post",
            "title": title,
            "content": f"<h1>{title}</h1><p>{content}</p>"
        }

        created_post = (
            service.posts()
            .insert(
                blogId=blog_id,
                body=post,
                isDraft=False
            )
            .execute()
        )

        print("POST CREATED")
        print(created_post)

        return {
            "success": True,
            "url": created_post.get("url", ""),
            "id": created_post.get("id", "")
        }

    except Exception as e:

        print("BLOGGER ERROR:")
        print(str(e))

        return {
            "success": False,
            "message": str(e)
        }
       
def authenticate_blogger():

    SCOPES = ["https://www.googleapis.com/auth/blogger"]

    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file(
            "token.json",
            SCOPES
        )

    if not creds or not creds.valid:

        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())

        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET_FILE,
                SCOPES
            )

            creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return build(
        "blogger",
        "v3",
        credentials=creds
    )

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category", "electronics")
    products = scrape_amazon_bestsellers(category)
    return jsonify({"products": products})


@app.route("/api/keywords", methods=["POST"])
def get_keywords():
    data    = request.json
    product = data.get("product_title", "")
    kws     = generate_keywords(product)
    return jsonify({"keywords": kws})


@app.route("/api/generate-blog", methods=["POST"])
def gen_blog():
    data     = request.json
    product  = data.get("product", {})
    keywords = data.get("keywords", [])
    blog     = generate_blog_post(product, keywords)
    return jsonify({"blog": blog})


@app.route("/api/publish", methods=["POST"])
def publish():
    data    = request.json
    title   = data.get("title", "")
    content = data.get("content", "")
    tags    = data.get("tags", [])
    result  = publish_to_wordpress(title, content, tags)
    return jsonify(result)

@app.route("/api/full-pipeline", methods=["POST"])
def full_pipeline():

    data = request.json
    product = data.get("product", {})

    print("Product:", product["title"])

    keywords = generate_keywords(product["title"])

    print("Keywords:", keywords)

    blog = generate_blog_post(product, keywords)

    print("Blog Generated")

    result = publish_to_wordpress(
        blog["title"],
        blog["content"],
        keywords
    )

    print("Published")

    return jsonify({
        "keywords": keywords,
        "blog": blog,
        "publish_result": result
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "task": "SEO Blog Post Creation Tool"})


if __name__ == "__main__":
    app.run(debug=True, port=5002)