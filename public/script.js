// NOVA Green — product API, categories, cart and checkout
// Original behavior preserved; backend endpoint: /api/products

let products=[];

const money=n=>n.toLocaleString('vi-VN')+'đ';

let category='Tất cả';

let cart={};

try{cart=JSON.parse(localStorage.getItem('nova_cart')||'{}')||{}}catch(e){cart={}};

function save(){localStorage.setItem('nova_cart',JSON.stringify(cart));

updateCount()}

function updateCount(){document.getElementById('count').textContent=Object.values(cart).reduce((a,b)=>a+b,0)}

function renderFilters(){document.getElementById('filters').innerHTML=['Tất cả',...new Set(products.map(p=>p.category))].map(c=>`<button class="filter ${category===c?'active':''}" onclick="setCategory('${c}')">${c}</button>`).join('')}

function setCategory(c){category=c;

renderFilters();

renderProducts()}

function renderProducts(){const q=document.getElementById('search').value.trim().toLocaleLowerCase('vi');

const list=products.filter(p=>(category==='Tất cả'||p.category===category)&&p.name.toLocaleLowerCase('vi').includes(q));

document.getElementById('resultCount').textContent=list.length+' sản phẩm';

document.getElementById('grid').innerHTML=list.length?list.map(p=>`<article class="product"><div class="visual">${p.tag?`<span class="tag">${p.tag}</span>`:''}${p.image?`<img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:contain">`:'📦'}</div><div class="info"><small>${p.category}</small><h3>${p.name}</h3><div class="price">${money(p.price)}</div><button class="add" onclick="add('${p.id}')">+ Thêm vào giỏ</button></div></article>`).join(''):'<p>Không tìm thấy sản phẩm phù hợp.</p>'}

function add(id){cart[id]=(cart[id]||0)+1;

save();

renderCart()}

function change(id,delta){cart[id]=(cart[id]||0)+delta;

if(cart[id]<=0)delete cart[id];

save();

renderCart()}

function renderCart(){const items=products.filter(p=>cart[p.id]);

document.getElementById('cartItems').innerHTML=items.length?items.map(p=>`<div class="cart-row"><div class="thumb">${p.image?`<img src="${p.image}" alt="" style="width:100%;height:100%;object-fit:contain">`:'📦'}</div><div class="cart-meta"><strong>${p.name}</strong><small>${money(p.price)}</small><div class="qty"><button onclick="change('${p.id}',-1)">−</button>${cart[p.id]}<button onclick="change('${p.id}',1)">+</button></div></div><b>${money(p.price*cart[p.id])}</b></div>`).join(''):'<div class="empty">Giỏ hàng đang trống 🛒</div>';

document.getElementById('total').textContent=money(items.reduce((sum,p)=>sum+p.price*cart[p.id],0))}

function openCart(){renderCart();

document.getElementById('drawer').classList.add('open')}

function closeCart(){document.getElementById('drawer').classList.remove('open')}

function checkout(){if(!Object.keys(cart).length){alert('Vui lòng thêm sản phẩm vào giỏ hàng.');

return}closeCart();

document.getElementById('modal').classList.add('open')}

function closeModal(){document.getElementById('modal').classList.remove('open')}document.getElementById('orderForm').addEventListener('submit',e=>{e.preventDefault();const order={id:'NOVA-'+Date.now(),items:{...cart},customer:Object.fromEntries(new FormData(e.target)),createdAt:new Date().toISOString()};const orders=JSON.parse(localStorage.getItem('nova_orders')||'[]');orders.push(order);localStorage.setItem('nova_orders',JSON.stringify(orders));cart={};save();renderCart();closeModal();e.target.reset();alert('Đã tạo đơn hàng demo '+order.id+'. Đơn chưa được gửi đến cửa hàng.');});

document.getElementById('search').addEventListener('input',renderProducts);

fetch('/api/products').then(r=>{if(!r.ok)throw Error('Không tải được sản phẩm');return r.json()}).then(data=>{products=data;renderFilters();renderProducts();renderCart();updateCount()}).catch(e=>{document.getElementById('grid').textContent=e.message});
