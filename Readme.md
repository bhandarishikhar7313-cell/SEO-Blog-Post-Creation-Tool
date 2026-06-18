# BlogForge AI – SEO Blog Post Creation Tool

## Overview

BlogForge AI is an AI-powered SEO Blog Creation Tool that automates the complete content creation workflow.

The application:

- Scrapes trending products from Amazon Best Sellers
- Generates SEO keywords using Google Trends
- Creates SEO-optimized blog articles
- Publishes blogs automatically to Blogger
- Supports multiple product categories and custom categories

---

## Features

### Product Scraping
- Amazon Best Seller scraping
- Multiple product categories
- Custom category support

### SEO Keyword Research
- Google Trends integration (PyTrends)
- Trending keyword extraction
- Automatic keyword selection

### Blog Generation
- SEO-optimized title generation
- 150–200 word blog articles
- Meta description generation
- SEO tags generation

### Blogger Publishing
- Automatic blog publishing
- Google OAuth authentication
- Blogger API integration

---

## System Architecture

![Architecture](architecture.png)

---

## Workflow

1. Select a category
2. Scrape bestselling products
3. Select a product
4. Generate SEO keywords
5. Generate blog article
6. Publish automatically to Blogger
7. Receive live blog URL

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask
- Flask-CORS

### APIs & Services
- Amazon Best Sellers
- Google Trends
- Blogger API
- Google OAuth

---

## Installation

### Clone Repository

```bash
git clone <repo-url>
cd BlogForge-AI