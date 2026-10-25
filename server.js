import express from 'express';
import pg from 'pg';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const app=express();
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'public');
app.use(express.json({limit:'3mb'}));
const {DATABASE_URL,ADMIN_PASSWORD}=process.env;
if(!DATABASE_URL||!ADMIN_PASSWORD){console.error('Missing DATABASE_URL or ADMIN_PASSWORD');process.exit(1)}
const db=new pg.Pool({connectionString:DATABASE_URL,ssl:DATABASE_URL.includes('localhost')?false:{rejectUnauthorized:false}});
await db.query('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC NOT NULL, category TEXT NOT NULL, stock INTEGER NOT NULL, description TEXT NOT NULL DEFAULT \'\', image TEXT NOT NULL DEFAULT \'\', created_at TIMESTAMPTZ NOT NULL DEFAULT now())');
const auth=(req,res,next)=>{const supplied=req.get('x-admin-password')||'';const a=Buffer.from(supplied),b=Buffer.from(ADMIN_PASSWORD);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:'Sai mật khẩu Admin'});next()};
const format=r=>({id:r.id,name:r.name,price:Number(r.price),category:r.category,stock:r.stock,description:r.description,image:r.image});
app.get('/api/products',async(req,res)=>{try{const r=await db.query('SELECT * FROM products ORDER BY created_at DESC');res.json(r.rows.map(format))}catch(e){console.error(e);res.status(500).json({error:'Không tải được sản phẩm'})}});
function validate(p){return p&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=120&&Number.isFinite(p.price)&&p.price>=0&&typeof p.category==='string'&&p.category.length<=80&&Number.isInteger(p.stock)&&p.stock>=0&&typeof (p.description||'')==='string'&&(p.description||'').length<=2000&&typeof (p.image||'')==='string'&&(!p.image||(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(p.image)&&p.image.length<2200000))}
app.post('/api/products',auth,async(req,res)=>{const p=req.body;if(!validate(p))return res.status(400).json({error:'Thông tin sản phẩm không hợp lệ hoặc ảnh quá lớn'});try{const id=crypto.randomUUID();await db.query('INSERT INTO products(id,name,price,category,stock,description,image) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,p.name.trim(),p.price,p.category,p.stock,p.description||'',p.image||'']);res.status(201).json({id})}catch(e){console.error(e);res.status(500).json({error:'Không lưu được sản phẩm'})}});
app.put('/api/products/:id',auth,async(req,res)=>{const p=req.body;if(!validate(p))return res.status(400).json({error:'Dữ liệu không hợp lệ'});try{const r=await db.query('UPDATE products SET name=$1,price=$2,category=$3,stock=$4,description=$5,image=$6 WHERE id=$7 RETURNING id',[p.name.trim(),p.price,p.category,p.stock,p.description||'',p.image||'',req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Không tìm thấy sản phẩm'});res.json({ok:true})}catch(e){console.error(e);res.status(500).json({error:'Không cập nhật được'})}});
app.delete('/api/products/:id',auth,async(req,res)=>{try{await db.query('DELETE FROM products WHERE id=$1',[req.params.id]);res.json({ok:true})}catch(e){console.error(e);res.status(500).json({error:'Không xóa được'})}});
app.use(express.static(root));app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Shop3D running'));
