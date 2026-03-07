# 🍷 Complete Product Management Guide

## ✅ Add Product Feature - Fully Functional!

Your product management system now includes **advanced features** for adding and editing products with complete control over all product details.

---

## 🎯 How to Add a New Product

### Step 1: Click "Add Product" Button
- Navigate to **Admin → Products** tab
- Click the gold **"+ Add Product"** button in the top-right corner

### Step 2: Fill in Product Details

The form is divided into two sections:

#### **📋 Basic Information** (Left Column)

1. **Product Name** * (Required)
   - Example: "Château Margaux 2015"
   - This is the main title customers will see

2. **Description**
   - Detailed product description
   - Include tasting notes, food pairings, etc.
   - Example: "A legendary vintage from one of the most prestigious estates in Bordeaux..."

3. **Category** * (Required)
   - Select: **Wine** or **Liquor**
   - Determines which section the product appears in

4. **Price (RWF)** * (Required)
   - Enter price in Rwandan Francs
   - Example: 1600000 (for 1.6M RWF)

5. **Origin**
   - Where the product comes from
   - Example: "Bordeaux, France" or "Speyside, Scotland"

6. **ABV** (Alcohol By Volume)
   - Percentage of alcohol
   - Example: "13.5%" or "40%"

7. **Year**
   - Vintage year (for wines)
   - Range: 1900 - Current year
   - Example: 2015

#### **🖼️ Image & Inventory** (Right Column)

1. **Product Image** 
   
   You have **TWO OPTIONS**:

   **Option A: Upload from Computer** (Recommended)
   - Click "Choose File"
   - Select an image from your computer
   - Supports: JPG, PNG, WebP
   - Preview shows instantly
   - Image is converted to base64 and stored in database

   **Option B: Use Image URL**
   - Paste a URL from the internet
   - Example: Unsplash, Imgur, or your own CDN
   - Must be a direct link (ends in .jpg, .png, etc.)
   - Cannot use both options simultaneously

2. **Current Stock** * (Required)
   - Number of items in inventory
   - Example: 10

3. **Min Stock Level**
   - Threshold for low-stock alerts
   - When stock falls below this, you'll see warnings
   - Example: 3 (get alerted when only 3 left)

4. **Tags**
   - Add multiple tags for better organization
   - Examples: "premium", "red-wine", "bordeaux", "french"
   - **How to add:**
     1. Type a tag in the input field
     2. Press **Enter** or click "Add" button
     3. Tag appears as a bubble below
   - **To remove:** Click the ✕ on any tag

### Step 3: Save Product
- Click **"Add Product"** button at bottom-right
- Product is saved to MySQL database
- Appears immediately in your store!

---

## ✏️ How to Edit Existing Products

1. Find the product card in Products tab
2. Click the **"Edit"** button
3. Modal opens with all current data pre-filled
4. Modify any fields you want
5. Click **"Update Product"**
6. Changes saved instantly!

---

## 🗑️ How to Delete Products

1. Find the product card
2. Click the red **"Delete"** button
3. Product is permanently removed from database
4. ⚠️ **Warning:** Cannot be undone!

---

## 📸 Image Guidelines

### Best Practices:
- **Size:** Minimum 800x800px for best quality
- **Format:** JPG or PNG
- **Background:** Clean, professional backgrounds
- **Lighting:** Well-lit, clear product shots
- **Consistency:** Use similar style across all products

### Image Sources:
1. **Local Upload** (Best for control)
   - Take photos yourself
   - Scan product labels
   - Full ownership rights

2. **URL Links** (Quick & Easy)
   - [Unsplash](https://unsplash.com) - Free high-quality images
   - [Pexels](https://pexels.com) - Free stock photos
   - [Pixabay](https://pixabay.com) - Free images
   - Manufacturer websites (with permission)

### Example Image URLs:
```
https://images.unsplash.com/photo-15108504777530-ce990e85c55e?auto=format&fit=crop&q=80&w=800
https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=800
```

---

## 🏷️ Tags Strategy

Good tags help customers find products:

### Wine Tags Examples:
- `red-wine`, `white-wine`, `rose-wine`
- `bordeaux`, `burgundy`, `champagne`
- `french`, `italian`, `spanish`
- `premium`, `luxury`, `vintage`
- `dry`, `sweet`, `sparkling`

### Liquor Tags Examples:
- `whisky`, `vodka`, `gin`, `rum`
- `scotch`, `bourbon`, `tequila`
- `aged`, `premium`, `craft`
- `smoky`, `smooth`, `spicy`

---

## 💡 Pro Tips

### 1. **Complete All Fields**
- More info = more customer confidence
- Helps with SEO and searchability
- Reduces customer questions

### 2. **Use High-Quality Images**
- First thing customers notice
- Professional photos increase sales
- Show bottle label clearly

### 3. **Write Compelling Descriptions**
- Tell the story behind the product
- Include tasting notes
- Mention food pairings
- Highlight awards or ratings

### 4. **Set Smart Stock Levels**
- Min stock level = early warning system
- Avoid running out unexpectedly
- Plan reorders in advance

### 5. **Price Competitively**
- Research market prices
- Consider your profit margin
- Factor in storage costs

---

## 🔧 Technical Details

### Data Storage:
- All products saved to **MySQL database**
- Table: `products`
- Images stored as **base64** (local uploads) or **URLs**
- Tags stored as **JSON array**

### Database Fields:
```sql
id              VARCHAR(50)   - Unique identifier
name            VARCHAR(255)  - Product name
description     TEXT          - Full description
price           DECIMAL(10,2) - Price in RWF
category        VARCHAR(50)   - Wine or Liquor
image           VARCHAR(500)  - Base64 or URL
origin          VARCHAR(255)  - Region/country
abv             VARCHAR(10)   - Alcohol percentage
year            INT           - Vintage year
stock           INT           - Current quantity
min_stock_level INT           - Alert threshold
tags            JSON          - Array of tags
```

### API Endpoints Used:
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update existing product
- `DELETE /api/products/:id` - Remove product

---

## ❓ Troubleshooting

### Issue: "Failed to save product"
**Solution:** Make sure all required fields (*) are filled:
- Product Name ✓
- Category ✓
- Price ✓
- Stock ✓

### Issue: Image not showing
**Solution:**
- For uploads: Check file size (should be < 5MB)
- For URLs: Ensure link is direct image URL
- Clear browser cache and refresh

### Issue: Can't upload image
**Solution:**
- Check file format (JPG, PNG, WebP only)
- Try a smaller file size
- Use URL option instead

### Issue: Tags not saving
**Solution:**
- Make sure to press Enter or click "Add"
- Tags should appear as bubbles before saving
- At least one tag helps but isn't required

---

## 📊 Bulk Upload vs Manual Entry

### Manual Entry (Add Product Button)
**Best for:**
- Adding 1-5 products
- Detailed product descriptions
- Careful curation
- Quick updates

**Advantages:**
- Full control over each field
- Immediate visual feedback
- Easy to customize
- No file preparation needed

### Bulk Upload (Bulk Button)
**Best for:**
- Importing 5+ products
- Initial catalog setup
- Regular large imports
- Supplier-provided data

**Advantages:**
- Fast for many products
- Consistent formatting
- Reusable templates
- Version control friendly

---

## 🎨 Form Features

### Smart UI Elements:
- ✨ **Real-time preview** of uploaded images
- 🔄 **Auto-save** form state while typing
- ⚡ **Instant validation** of required fields
- 📱 **Mobile-responsive** design
- 🎯 **Focus indicators** for accessibility
- 💾 **Base64 conversion** happens automatically

### Image Preview:
- Shows thumbnail when uploading
- Live preview before saving
- Easy removal with X button
- Switch between upload/URL anytime

---

## 🔐 Data Persistence

All changes are:
- ✅ Saved to **MySQL database** immediately
- ✅ **Persistent** across server restarts
- ✅ **Backed up** in your database
- ✅ **Searchable** in admin panel
- ✅ **Visible** to customers instantly

---

## 🚀 Quick Start Example

**Scenario:** Add a new premium whiskey

1. Click **"+ Add Product"**
2. Fill in:
   ```
   Name: The Macallan 25 Year Old
   Category: Liquor
   Price: 2500000
   Origin: Speyside, Scotland
   ABV: 43%
   Year: (leave blank or enter 1998)
   Stock: 5
   Min Stock: 2
   Tags: whisky, scotch, premium, aged, luxury
   ```
3. Upload image or paste URL
4. Write description: "A masterpiece of craftsmanship..."
5. Click **"Add Product"**
6. Done! ✅ Product is live

---

## 📞 Need Help?

If you encounter issues:
1. Check console for error messages
2. Verify all required fields are filled
3. Try refreshing the page
4. Check MySQL database connection
5. Review server logs

---

**Happy selling!** 🍷🥃

Your product catalog is now fully manageable with professional-grade tools!
