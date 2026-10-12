# Documentation

Project documentation for the Sachdeva Carry Hub digital showroom. Start with the root
[README](../README.md) for setup.

| Document                                   | Read it when you…                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)         | need the big picture: layers, rendering, caching, request flows           |
| [DATABASE.md](DATABASE.md)                 | change the schema, write queries, or touch RLS                            |
| [API.md](API.md)                           | call or change a route handler                                            |
| [SECURITY.md](SECURITY.md)                 | touch auth, admin access, secrets, uploads, or anything user-supplied     |
| [MEDIA.md](MEDIA.md)                       | work on image upload/optimisation, Cloudinary, or QR codes                |
| [DEPLOYMENT.md](DEPLOYMENT.md)             | deploy to Vercel, configure a domain, or go live                          |
| [DEVELOPMENT.md](DEVELOPMENT.md)           | write code here: conventions and Next.js 16 / Cache Components gotchas    |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)   | see an error and want the fix                                             |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md)           | run the store day-to-day (written for the shop owner, non-technical)      |

## Scope in one paragraph

This is a **digital showroom** for a physical bag store, not an online shop. Customers browse
products (online or by scanning a QR sticker on a product in the store) and then **WhatsApp,
call, or visit**. There is deliberately no cart, checkout, payment, orders, customer accounts,
inventory, wishlist, reviews, or 3D/360° viewer. Please keep it that way unless the business
requirements change.
