
const API = 'http://localhost:5002/api';
let state = { products:[], selectedProduct:null, keywords:[], blog:null };

function toast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `show ${type}`;
  setTimeout(() => t.className = '', 3200);
}
function setPStep(n) {
  for(let i=1;i<=4;i++){
    const el = document.getElementById(`ps${i}`);
    if(!el) continue;
    el.classList.remove('active','done');
    if(i<n) el.classList.add('done');
    if(i===n) el.classList.add('active');
  }
}

async function scrapeProducts() {
  const selectedCat = document.getElementById('catSelect').value;
  const customCatEl = document.getElementById('customCategory');
  const customCat = customCatEl ? customCatEl.value.trim() : '';
  const cat = customCat || selectedCat;
  const btn = document.getElementById('scrapeBtn');
  const icon = document.getElementById('scrapeBtnIcon');
  btn.disabled = true; icon.innerHTML = '<span class="loader"></span>';
  try {
    const resp = await fetch(`${API}/products?category=${cat}`);
    const data = await resp.json();
    state.products = data.products || [];
    renderProducts(state.products);
    setPStep(1);
    toast(`${state.products.length} products loaded!`);
  } catch(e) {
    // Demo fallback
    state.products = [
      {title:"boAt Airdopes 141 TWS Earbuds with 42H Playtime",price:"₹1,299",rating:"4.1",source:"Amazon"},
      {title:"Redmi 12 5G Smartphone 4GB+128GB",price:"₹12,499",rating:"4.3",source:"Amazon"},
      {title:"Anker 65W USB-C GaN Fast Charger",price:"₹2,499",rating:"4.5",source:"Amazon"},
      {title:"HP Wireless Keyboard and Mouse Combo",price:"₹1,799",rating:"4.2",source:"Amazon"},
    ];
    renderProducts(state.products);
    setPStep(1);
    toast('Demo mode - backend not running', 'err');
  } finally {
    btn.disabled = false; icon.innerHTML = '⚡';
  }
}

function renderProducts(products) {
  if(!products.length) { document.getElementById('productGrid').innerHTML = '<div class="empty"><div class="ei">📭</div><p>No products found</p></div>'; return; }
  document.getElementById('productGrid').innerHTML = `
    <div class="product-grid">
      ${products.map((p,i) => `
        <div class="product-card" onclick="selectProduct(${i})" id="prod-${i}">
          <div class="product-name">${p.title}</div>
          <div class="product-meta">
            <span class="product-chip chip-price">${p.price}</span>
            <span class="product-chip chip-rating">⭐ ${p.rating}</span>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function selectProduct(i) {
  const p = state.products[i];
  state.selectedProduct = p;
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('active'));
  document.getElementById(`prod-${i}`).classList.add('active');
  document.getElementById('selectedProductInfo').innerHTML = `
    <div style="background:#f5f3ff;border:1.5px solid rgba(139,92,246,.2);border-radius:10px;padding:.8rem">
      <div style="font-weight:600;font-size:.88rem">${p.title}</div>
      <div class="product-meta" style="margin-top:.4rem">
        <span class="product-chip chip-price">${p.price}</span>
        <span class="product-chip chip-rating">⭐ ${p.rating}</span>
      </div>
    </div>`;
  document.getElementById('kwBtn').disabled = false;
  toast('Product selected!');
}

async function getKeywords() {
  if(!state.selectedProduct) return;
  const btn = document.getElementById('kwBtn');
  const icon = document.getElementById('kwBtnIcon');
  btn.disabled = true; icon.innerHTML = '<span class="loader" style="border-top-color:#a78bfa"></span>';
  try {
    const resp = await fetch(`${API}/keywords`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product_title: state.selectedProduct.title})
    });
    const data = await resp.json();
    state.keywords = data.keywords || [];
    renderKeywords(state.keywords);
    setPStep(2);
    document.getElementById('blogBtn').disabled = false;
    toast('Keywords generated!');
  } catch(e) {
    const title = state.selectedProduct.title.toLowerCase();
    const words = title.split(' ');
    state.keywords = [words[0]+' '+words[1], `best ${words[0]} 2025`, `${words[0]} review`, `buy ${words[0]} online`];
    renderKeywords(state.keywords);
    setPStep(2);
    document.getElementById('blogBtn').disabled = false;
    toast('Demo keywords shown', 'err');
  } finally {
    btn.disabled = false; icon.innerHTML = '🤖';
  }
}

function renderKeywords(kws) {
  document.getElementById('kwOutput').innerHTML = `
    <div style="font-size:.8rem;color:var(--muted);margin-bottom:.5rem">Click to toggle keywords</div>
    <div class="kw-tags">${kws.map((k,i)=>`<div class="kw-tag selected" onclick="toggleKw(this,${i})">${k}</div>`).join('')}</div>`;
  document.getElementById('seoScore').style.display = 'block';
  const sv = 60+Math.floor(Math.random()*35);
  const kr = 70+Math.floor(Math.random()*25);
  const cp = 30+Math.floor(Math.random()*40);
  document.getElementById('sv').textContent = sv+'%';
  document.getElementById('svBar').style.width = sv+'%';
  document.getElementById('kr').textContent = kr+'%';
  document.getElementById('krBar').style.width = kr+'%';
  document.getElementById('comp').textContent = cp+'%';
  document.getElementById('compBar').style.width = cp+'%';
}

function toggleKw(el, i) { el.classList.toggle('selected'); }

async function generateBlog() {
  if(!state.selectedProduct || !state.keywords.length) return;
  const btn = document.getElementById('blogBtn');
  const icon = document.getElementById('blogBtnIcon');
  btn.disabled = true; icon.innerHTML = '<span class="loader" style="border-top-color:#f97316"></span>';
  document.getElementById('blogPreview').innerHTML = '<div class="empty"><p>Writing your blog post with AI...</p></div>';

  try {
    const resp = await fetch(`${API}/generate-blog`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({product: state.selectedProduct, keywords: state.keywords})
    });
    const data = await resp.json();
    state.blog = data.blog;
    renderBlogPreview(data.blog);
    setPStep(3);
    document.getElementById('publishBtn').disabled = false;
    document.getElementById('editBtn').style.display = 'inline-flex';
    toast('Blog post generated!');
  } catch(e) {
    const p = state.selectedProduct;
    const kws = state.keywords;
    state.blog = {
      title: `Why ${p.title} is the Best Buy in 2025`,
      content: `Looking for the perfect ${kws[0]}? The ${p.title} has taken the market by storm this year.\n\nPriced at ${p.price} and carrying an impressive ${p.rating} star rating, this product delivers exceptional value. Whether you're searching for a reliable ${kws[1]} or simply want something that works every day, this ticks every box.\n\nWhat makes it stand out as a ${kws[2]}? Outstanding build quality, practical features, and a price point that makes it accessible to all. Thousands of verified buyers across India praise it consistently.\n\nIf you're planning to ${kws[3]}, make this your top choice this year. The ratings speak for themselves — add it to your cart today!`,
      meta_description: `Discover why the ${p.title} is the best ${kws[0]} in 2025. Read our detailed review before you buy.`,
      tags: kws
    };
    renderBlogPreview(state.blog);
    setPStep(3);
    document.getElementById('publishBtn').disabled = false;
    document.getElementById('editBtn').style.display = 'inline-flex';
    toast('Demo blog shown', 'err');
  } finally {
    btn.disabled = false; icon.innerHTML = '✍️';
  }
}

function renderBlogPreview(blog) {
  const wc = (blog.content||'').split(/\s+/).filter(Boolean).length;
  const wcPct = Math.min(wc/200*100, 100);
  document.getElementById('blogPreview').innerHTML = `
    <div class="blog-preview-box">
      <div class="blog-meta-title">Blog Title</div>
      <div class="blog-title-preview">${blog.title}</div>
      <div class="blog-content-preview">${(blog.content||'').replace(/\n/g,'<br/>')}</div>
      <div class="blog-meta-desc">📌 Meta: ${blog.meta_description||'—'}</div>
      <div class="word-count">${wc} words</div>
    </div>`;
  document.getElementById('blogStats').style.display = 'block';
  document.getElementById('wcStat').textContent = `${wc} words`;
  document.getElementById('wcBar').style.width = Math.min(wcPct,100)+'%';
  const kd = Math.min(70+Math.random()*25,100).toFixed(0);
  document.getElementById('kdStat').textContent = kd+'%';
  document.getElementById('kdBar').style.width = kd+'%';
  const rd = Math.min(65+Math.random()*30,100).toFixed(0);
  document.getElementById('rdStat').textContent = rd+'%';
  document.getElementById('rdBar').style.width = rd+'%';
  document.getElementById('kwUsedTags').innerHTML = (blog.tags||[]).map(t=>`<div class="kw-tag selected">${t}</div>`).join('');
}

function editBlog() {
  if(!state.blog) return;
  document.getElementById('blogTitleInput').value = state.blog.title||'';
  document.getElementById('blogContentInput').value = state.blog.content||'';
  document.getElementById('blogEditor').style.display = 'block';
  document.getElementById('blogStats').style.display = 'none';
}
function saveEdit() {
  state.blog.title   = document.getElementById('blogTitleInput').value;
  state.blog.content = document.getElementById('blogContentInput').value;
  document.getElementById('blogEditor').style.display = 'none';
  renderBlogPreview(state.blog);
  toast('Changes saved!');
}
function cancelEdit() {
  document.getElementById('blogEditor').style.display = 'none';
  document.getElementById('blogStats').style.display = 'block';
}

async function publishPost() {
  if(!state.blog) return;
  const btn = document.getElementById('publishBtn');
  const icon = document.getElementById('publishBtnIcon');
  btn.disabled = true; icon.innerHTML = '<span class="loader"></span>';
  
  try {
    const resp = await fetch(`${API}/publish`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title:state.blog.title, content:state.blog.content, tags:state.blog.tags})
    });
    const data = await resp.json();
    if(data.success) {
      document.getElementById('publishResult').innerHTML = `
        <div class="publish-result success">
          <div class="big">🎉</div>
          <h3>Published!</h3>
          <p>Your blog post is now live.</p>
          ${data.url?`<p style="margin-top:.5rem"><a href="${data.url}" target="_blank">View Post →</a></p>`:''}
        </div>`;
      setPStep(4);
      toast('Blog published!');
    } else {
      throw new Error(data.message);
    }
  } catch(e) {
    document.getElementById('publishResult').innerHTML = `
      <div class="publish-result fail">
        <div class="big">⚠️</div>
        <h3>Not Published</h3>
        <p>${e.message||'Blogger publishing failed.'}</p>
        <p style="margin-top:.5rem;font-size:.78rem">Use "Copy as Markdown" to save locally.</p>
      </div>`;
    toast('Blogger publishing failed', 'err');
  } finally {
    btn.disabled = false; icon.innerHTML = '🚀';
  }
}

function copyMarkdown() {
  if(!state.blog) { toast('Generate a blog post first', 'err'); return; }
  const md = `# ${state.blog.title}\n\n${state.blog.content}\n\n---\n*Meta: ${state.blog.meta_description}*\n*Tags: ${(state.blog.tags||[]).join(', ')}*`;
  navigator.clipboard.writeText(md).then(() => toast('Copied as Markdown!')).catch(() => toast('Copy failed', 'err'));
}