# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]: ShopEase
    - generic [ref=e6]:
      - link "Home" [ref=e7] [cursor=pointer]:
        - /url: ./Home.html
      - link "Cart" [ref=e8] [cursor=pointer]:
        - /url: ./Cart.html
      - link "Orders" [ref=e9] [cursor=pointer]:
        - /url: ./Orders.html
  - generic [ref=e10]:
    - heading "Login" [level=1] [ref=e11]
    - paragraph [ref=e12]: Welcome back. Enter your credentials.
    - generic [ref=e14]:
      - generic [ref=e15]:
        - text: Email
        - textbox "you@example.com" [ref=e16]
      - generic [ref=e17]:
        - text: Password
        - textbox "Your password" [ref=e18]
      - button "Login" [ref=e19] [cursor=pointer]
      - generic [ref=e20]:
        - link "Create account" [ref=e21] [cursor=pointer]:
          - /url: ./Register.html
        - link "Forgot password?" [ref=e22] [cursor=pointer]:
          - /url: "#"
```