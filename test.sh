#!/bin/bash

BASE_url="http://localhost:3010/api"

test_req() {
    METHOD=$1
    ENDPOINT=$2
    EXPECTED=$3
    DESC=$4

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "$BASE_url$ENDPOINT")

    if [ "$STATUS" == "$EXPECTED" ]; then
        echo "✅ PASS: [$METHOD] $ENDPOINT - $DESC (Got $STATUS)"
    else
        echo "❌ FAIL: [$METHOD] $ENDPOINT - $DESC (Expected $EXPECTED, Got $STATUS)"
    fi
}

test_view() {
    METHOD=$1
    ENDPOINT=$2
    EXPECTED=$3
    DESC=$4

    # Use port 3010 root (no /api prefix)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "http://localhost:3010$ENDPOINT")

    if [ "$STATUS" == "$EXPECTED" ]; then
        echo "✅ PASS: [$METHOD] $ENDPOINT - $DESC (Got $STATUS)"
    else
        echo "❌ FAIL: [$METHOD] $ENDPOINT - $DESC (Expected $EXPECTED, Got $STATUS)"
    fi
}

echo "Starting Comprehensive API Validation on port 3010..."
echo "-----------------------------------------------------"

# === 1. BOOKS (/api/books) ===
echo -e "\n[1] BOOKS CONTROLLER"
# Success (5)
test_req "GET" "/books" "200" "Get all books (Default)"
test_req "GET" "/books?limit=1" "200" "Get books with limit=1"
test_req "GET" "/books?page=1&limit=5" "200" "Get books page 1 params"
test_req "GET" "/books/1" "200" "Get book ID 1"
test_req "GET" "/books/2" "200" "Get book ID 2"

# Failure (5)
test_req "GET" "/books/99999" "404" "Get non-existent book"
test_req "POST" "/books" "302" "Create book without auth (Redirects to Login/401)" # AuthGuard returns 302/401 depending on config. We observed 302.
test_req "PATCH" "/books/1" "302" "Update book without auth"
test_req "DELETE" "/books/1" "302" "Delete book without auth"
test_req "GET" "/books?page=invalid" "400" "Get books with invalid page param"
test_req "GET" "/books?page=0" "400" "Get books with page=0 (Boundary)"
test_req "GET" "/books?limit=-5" "400" "Get books with limit=-5 (Negative)"
test_req "GET" "/books?limit=0" "400" "Get books with limit=0 (Zero)"
test_req "GET" "/books/abc" "400" "Get book with string ID"
test_req "GET" "/books/1.5" "400" "Get book with float ID"
test_req "GET" "/books?page=1.5" "400" "Get books with float page"
test_req "GET" "/books?unknown=param" "200" "Get books with unknown param (Ignored)"

# === 2. COMMENTS (/api/comments) ===
echo -e "\n[2] COMMENTS CONTROLLER"
# Success (5)
test_req "GET" "/comments" "200" "Get all comments"
test_req "GET" "/comments?limit=2" "200" "Get comments limit=2"
test_req "GET" "/comments?page=1" "200" "Get comments page=1"
test_req "GET" "/comments?page=100" "200" "Get comments empty page"
test_req "GET" "/comments?limit=10&page=1" "200" "Get comments combined params"

# Failure (5)
test_req "POST" "/comments" "302" "Create comment without auth"
test_req "GET" "/comments?page=abc" "400" "Invalid page param"
test_req "GET" "/comments?limit=abc" "400" "Invalid limit param"
test_req "DELETE" "/comments/1" "404" "Delete comment (Method not mapped)"
test_req "PUT" "/comments/1" "404" "Put comment (Method not mapped)"
test_req "GET" "/comments?page=-1" "400" "Page negative"
test_req "GET" "/comments?limit=0" "400" "Limit zero"
test_req "GET" "/comments?page=1.5" "400" "Page float"
test_req "GET" "/comments?extra=1" "200" "Extra param ignored"

# === 3. FAVORITES (/api/favorites) ===
echo -e "\n[3] FAVORITES CONTROLLER"
# Success (5)
test_req "GET" "/favorites" "200" "Get all favorites"
test_req "GET" "/favorites?limit=1" "200" "Get favorites limit=1"
test_req "GET" "/favorites?page=1" "200" "Get favorites page=1"
test_req "GET" "/favorites?page=2" "200" "Get favorites page=2"
test_req "GET" "/favorites?limit=5" "200" "Get favorites limit=5"

# Failure (5)
test_req "POST" "/favorites" "302" "Add favorite without auth"
test_req "DELETE" "/favorites?bookId=1&userId=1" "302" "Remove favorite without auth"
test_req "GET" "/favorites?page=xyz" "400" "Invalid page"
test_req "GET" "/favorites?page=0" "400" "Page zero"
test_req "GET" "/favorites?limit=-10" "400" "Limit negative"
test_req "GET" "/favorites?page=1.5" "400" "Page float"
test_req "GET" "/favorites?extra=1" "200" "Extra param ignored"
test_req "PATCH" "/favorites/1" "404" "Patch favorite (Not found)"
test_req "POST" "/favorites/invalid" "404" "Invalid endpoint"

# === 4. RATINGS (/api/ratings) ===
echo -e "\n[4] RATINGS CONTROLLER"
# Success (5)
test_req "GET" "/ratings" "200" "Get all ratings"
test_req "GET" "/ratings?page=1" "200" "Get ratings page 1"
test_req "GET" "/ratings?limit=1" "200" "Get ratings limit 1"
test_req "GET" "/ratings?page=10" "200" "Get ratings empty page"
test_req "GET" "/ratings?limit=10" "200" "Get ratings limit 10"

# Failure (5)
test_req "POST" "/ratings" "302" "Post rating without auth"
test_req "GET" "/ratings?page=bad" "400" "Invalid page"
test_req "DELETE" "/ratings/1" "404" "Delete rating (1) - expected 404 if not found (requires auth/existence)" 
test_req "GET" "/ratings?page=-5" "400" "Page negative"
test_req "GET" "/ratings?limit=0" "400" "Limit zero"
test_req "GET" "/ratings?page=1.5" "400" "Page float"
test_req "GET" "/ratings?extra=1" "200" "Extra param ignored"
test_req "PUT" "/ratings/1" "404" "Put rating (Not mapped)"
test_req "GET" "/ratings/999" "404" "Get non-existent rating (Mapped but not found)"

# === 5. USER-BOOKS (/api/user-books) ===
echo -e "\n[5] USER-BOOKS CONTROLLER"
# Success (5)
test_req "GET" "/user-books" "200" "Get all user books"
test_req "GET" "/user-books?limit=1" "200" "Get user books limit 1"
test_req "GET" "/user-books?page=1" "200" "Get user books page 1"
test_req "GET" "/user-books?limit=5" "200" "Get user books limit 5"
test_req "GET" "/user-books?page=2" "200" "Get user books page 2"

# Failure (5)
test_req "POST" "/user-books" "302" "Update status without auth"
test_req "GET" "/user-books?page=not_int" "400" "Invalid page"
test_req "DELETE" "/user-books/1" "404" "Delete not mapped"
test_req "GET" "/user-books?page=1.5" "400" "Page float"
test_req "GET" "/user-books?extra=1" "200" "Extra param ignored"
test_req "GET" "/user-books?page=0" "400" "Page zero"
test_req "GET" "/user-books?limit=-1" "400" "Limit negative"
test_req "PUT" "/user-books/1" "404" "Put not mapped"
test_req "PATCH" "/user-books" "404" "Patch not mapped"

# === 6. USERS (/api/users) ===
echo -e "\n[6] USERS CONTROLLER"
# Success (5)
test_req "GET" "/users" "200" "Get all users"
test_req "GET" "/users?limit=1" "200" "Get users limit=1"
test_req "GET" "/users?page=1" "200" "Get users page=1"
test_req "GET" "/users/1" "200" "Get user ID 1"
test_req "GET" "/users?page=1&limit=5" "200" "Get users combined params"
test_req "GET" "/users/1/friends" "200" "Get user friends"

# Failure (5)
test_req "POST" "/users" "302" "Create user without auth"
test_req "GET" "/users/abc" "400" "Get user with string ID"
test_req "GET" "/users/1.5" "400" "Get user with float ID"
test_req "GET" "/users?page=1.5" "400" "Page float"
test_req "GET" "/users?extra=1" "200" "Extra param ignored"
test_req "PATCH" "/users/1" "302" "Update user without auth"
test_req "DELETE" "/users/1" "302" "Delete user without auth"
test_req "GET" "/users?page=0" "400" "Page zero"
test_req "GET" "/users?limit=-1" "400" "Negative limit check"
test_req "GET" "/users?page=bad" "400" "Invalid page param"
test_req "GET" "/users/99999" "404" "Get non-existent user"

# === 7. TRICKY SCENARIOS ===
echo -e "\n[7] TRICKY SCENARIOS"
# 7.1 Duplicate params (Array pollution)
test_req "GET" "/books?page=1&page=2" "400" "Duplicate page param (Array)"

# 7.2 Integer Overflow (Max Safe Integer)
test_req "GET" "/books?page=9007199254740992" "400" "Integer Overflow (Page > MAX_SAFE_INTEGER)"

# 7.3 Scientific Notation
test_req "GET" "/books?page=1e1" "400" "Scientific notation"

# 7.4 Hexadecimal
test_req "GET" "/books?page=0xFF" "400" "Hexadecimal string"

test_req "GET" "/books/9007199254740992" "400" "ID Integer Overflow"

# === 8. AUTH (/api/auth) ===
echo -e "\n[8] AUTH CONTROLLER"
test_req "POST" "/auth/login" "400" "Login empty body (Validation Error)" 
test_req "POST" "/auth/register" "400" "Register empty body (Validation Error)"

# === 9. FRONTEND/VIEWS (Part A) ===
echo -e "\n[9] FRONTEND/VIEWS (Part A)"
test_view "GET" "/" "200" "Home Page"
test_view "GET" "/about" "200" "About Page"
test_view "GET" "/friends-reads" "200" "Friends Reads Page"
test_view "GET" "/users/readers" "200" "Readers List"
test_view "GET" "/users" "200" "Users List (Alias)"
test_view "GET" "/users/1" "200" "User Profile (ID 1)"
test_view "GET" "/users/me" "302" "My Profile (Redirect to Login)"

# === 10. FRONTEND/VIEWS (Part B - Books) ===
echo -e "\n[10] FRONTEND/VIEWS (Part B - Books)"
test_view "GET" "/books" "200" "Books List"
test_view "GET" "/books/create" "302" "Create Book Page (Auth protect)"
test_view "GET" "/books/1" "200" "Book Detail (ID 1)"
test_view "GET" "/books/1/read" "200" "Read Book Page (ID 1)"
test_view "GET" "/books/test-notification" "200" "Test Notification Trigger"

# === 11. FRONTEND/VIEWS (Part C - Auth Pages) ===
echo -e "\n[11] FRONTEND/VIEWS (Part C - Auth Pages)"
test_view "GET" "/login" "200" "Login Page"
test_view "GET" "/register" "200" "Register Page"

# === 12. VIEW ACTIONS (Forms & AJAX) ===
echo -e "\n[12] VIEW ACTIONS (Forms & AJAX)"
test_view "POST" "/books" "302" "Submit Book Form (Unauth -> Redirect)"

# 12.2 Avatar Upload (Requires Auth - Should redirect 302 or 403)
test_view "POST" "/users/1/avatar" "302" "Upload Avatar (Unauth -> Redirect)"

# 12.3 Add Friend Action (Requires Auth)
test_view "POST" "/users/friends/2" "302" "Add Friend Action (Unauth -> Redirect)"

# 12.4 Remove Friend Action (Requires Auth)
test_view "POST" "/users/friends/2/remove" "302" "Remove Friend Action (Unauth -> Redirect)"

# 12.5 Update User 
test_view "PATCH" "/users/1" "200" "Update User Profile" 
test_view "PATCH" "/books/1" "302" "Update Book Action (Unauth -> Redirect)"
