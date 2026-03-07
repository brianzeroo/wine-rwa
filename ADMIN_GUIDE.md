# 📦 Admin Panel Guide - Vintner & Spirit

## ✅ Add Product Button Added!

The "Add Product" button has been added to the Products tab in the Admin panel.

---

## 🎯 How to Use the Admin Panel

### 1. **Add Product Button** (NEW!)
Located in the **Products** tab, top-right corner.

**What it does:**
- Opens the product editor modal with a blank product form
- Allows you to create a new product from scratch
- Saves directly to your MySQL database

**How to use:**
1. Click the **"+ Add Product"** button (gold button)
2. Fill in the product details:
   - Name, Description, Price
   - Category (Wine/Liquor)
   - Image URL
   - Origin, ABV
   - Stock quantity
3. Click **"Save Product"**
4. The product is instantly saved to the database!

---

### 2. **Bulk Upload Button** 

Located next to the "Add Product" button in the **Products** tab.

**What it does:**
- Allows you to upload multiple products at once via a JSON file
- Perfect for importing large product catalogs
- Updates existing products if IDs match

**How to use:**
1. Prepare a JSON file with your products (see format below)
2. Click the **"Bulk Upload"** button
3. Select your JSON file
4. All products will be uploaded at once!

#### 📄 JSON File Format for Bulk Upload

```json
[
  {
    "id": "w4",
    "name": "New Wine Product",
    "description": "Amazing wine with great taste",
    "price": 150000,
    "category": "Wine",
    "image": "https://example.com/image.jpg",
    "origin": "Napa Valley, USA",
    "abv": "13.5%",
    "year": 2020,
    "stock": 50,
    "minStockLevel": 10,
    "tags": ["premium", "red-wine"]
  },
  {
    "id": "l4",
    "name": "Premium Whiskey",
    "description": "Aged to perfection",
    "price": 320000,
    "category": "Liquor",
    "image": "https://example.com/whiskey.jpg",
    "origin": "Scotland",
    "abv": "40%",
    "stock": 30,
    "minStockLevel": 5,
    "tags": ["whisky", "scotch"]
  }
]
```

**Required fields:**
- `id` - Unique identifier (e.g., "w4", "l4")
- `name` - Product name
- `price` - Price in RWF
- `category` - "Wine" or "Liquor"

**Optional fields:**
- `description`, `image`, `origin`, `abv`, `year`, `stock`, `minStockLevel`, `tags`

---

### 3. **Edit Product**
Click the **"Edit"** button on any product card.

**What it does:**
- Opens the product editor modal with existing data
- Allows you to modify any product details
- Updates the database when saved

---

### 4. **Delete Product**
Click the **"Delete"** button (red) on any product card.

**What it does:**
- Removes the product from the database
- Cannot be undone!

---

## 🛍️ Other Admin Tabs

### **Dashboard Tab**
- View sales analytics
- See total orders and revenue
- Top selling products
- Customer growth charts

### **Orders Tab**
- View all customer orders
- See order status (Pending, Processing, Shipped, Delivered)
- Track order history

### **Discounts Tab**
- Create new discount codes
- Manage existing codes
- Set percentage or fixed discounts
- Configure usage limits and date ranges

### **Customers Tab**
- View all registered customers
- See customer spending and loyalty points
- Contact information

### **Inventory Tab**
- Monitor stock levels
- Get low stock alerts
- Quick stock quantity updates
- Export inventory reports

### **Settings Tab**
- Update store name
- Configure PayPack payment gateway
- Toggle maintenance mode
- Enable/disable email notifications

---

## 🔐 Admin Login

**Password:** `admin123`

To access the admin panel:
1. Navigate to `/admin` route
2. Enter the password
3. Access all admin features

---

## 💡 Tips & Best Practices

### Adding Products
- **Single product?** Use the "Add Product" button
- **Multiple products?** Use "Bulk Upload" with a JSON file
- **Updating stock?** Use the Inventory tab for quick updates

### Product Images
- Use high-quality images (minimum 800x800px)
- Host images on Unsplash, Imgur, or your own server
- Use consistent image styles across products

### Pricing
- All prices are in Rwandan Francs (RWF)
- Consider psychological pricing (e.g., 99,900 instead of 100,000)
- Keep premium products visually distinct

### Stock Management
- Set `minStockLevel` to get low stock alerts
- Check Inventory tab regularly
- Update stock before it runs out

### Discount Codes
- Use codes like "WELCOME10" for new customers
- Set expiration dates to create urgency
- Limit usage to prevent abuse

---

## 🎨 UI Colors Explained

- **Gold buttons** - Primary actions (Save, Add, Confirm)
- **White/Transparent buttons** - Secondary actions (Edit, Upload)
- **Red buttons** - Destructive actions (Delete)

---

## 📊 Database Integration

All admin actions now save directly to your **MySQL database**:
- ✅ Products are persistent
- ✅ Orders are tracked
- ✅ Customers are stored
- ✅ Discount codes are saved
- ✅ Settings are preserved

**No data will be lost on server restart!**

---

## 🚀 Quick Start Example

**Scenario:** You want to add a new wine product

**Option 1: Single Product (Recommended for 1-5 items)**
1. Go to Products tab
2. Click "+ Add Product"
3. Fill in the form:
   ```
   Name: Château Margaux 2016
   Price: 1,700,000 RWF
   Category: Wine
   Origin: Bordeaux, France
   Stock: 15
   ```
4. Click "Save Product"
5. Done! ✅

**Option 2: Bulk Upload (Recommended for 5+ items)**
1. Create a JSON file (`new-products.json`)
2. Add your products in the format shown above
3. Go to Products tab
4. Click "Bulk Upload"
5. Select the JSON file
6. Done! ✅

---

## ❓ FAQ

**Q: Why can't I see the Add Product button?**
A: It should be in the top-right of the Products tab. If not visible, refresh the page.

**Q: What happens if I upload a product with an existing ID?**
A: The existing product will be updated with the new data.

**Q: Can I upload images directly?**
A: No, you need to provide image URLs. Upload images to a hosting service first.

**Q: How do I edit multiple products at once?**
A: Use the Bulk Upload feature with updated data.

**Q: Where is the data stored?**
A: In your MySQL database (`vintner_spirit`), in the `products` table.

---

## 🎉 Summary

You now have full control over your e-commerce store:

✅ **Add Product** button - For creating single products
✅ **Bulk Upload** button - For importing multiple products via JSON
✅ **Edit/Delete** - For managing existing products
✅ **Inventory Management** - For tracking stock levels
✅ **Full MySQL Integration** - All data is persistent!

**Happy managing!** 🍷🥃
