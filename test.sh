#!/bin/bash

PORT=3010
BASE_url="http://localhost:$PORT/api"

test_req() {
    METHOD=$1
    ENDPOINT=$2
    EXPECTED=$3
    DESC=$4
    DATA=$5

    if [ -z "$DATA" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "$BASE_url$ENDPOINT" -H "Accept: application/json")
    else
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "$BASE_url$ENDPOINT" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "$DATA")
    fi

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

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "http://localhost:$PORT$ENDPOINT")

    if [ "$STATUS" == "$EXPECTED" ]; then
        echo "✅ PASS: [$METHOD] $ENDPOINT - $DESC (Got $STATUS)"
    else
        echo "❌ FAIL: [$METHOD] $ENDPOINT - $DESC (Expected $EXPECTED, Got $STATUS)"
    fi
}

echo "Starting Comprehensive API Validation on port $PORT..."
echo "-----------------------------------------------------"

# === 1. BOOKS (/api/books) ===
echo -e "\n[1] BOOKS CONTROLLER"
test_req "GET" "/books" "200" "Get all books (Default)"
test_req "GET" "/books?limit=1" "200" "Get books with limit=1"
test_req "GET" "/books?page=1&limit=5" "200" "Get books page 1 params"
test_req "GET" "/books/1" "200" "Get book ID 1"
test_req "GET" "/books/2" "200" "Get book ID 2"

# Failure (5)
test_req "GET" "/books/99999" "404" "Get non-existent book"
test_req "POST" "/books" "401" "Create book without auth (Expected 401)"
test_req "PATCH" "/books/1" "401" "Update book without auth"
test_req "DELETE" "/books/1" "401" "Delete book without auth"
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
test_req "GET" "/comments" "200" "Get all comments"
test_req "GET" "/comments?limit=2" "200" "Get comments limit=2"
test_req "GET" "/comments?page=1" "200" "Get comments page=1"
test_req "GET" "/comments?page=100" "200" "Get comments empty page"
test_req "GET" "/comments?limit=10&page=1" "200" "Get comments combined params"

# Failure (5)
test_req "POST" "/comments" "401" "Create comment without auth"
test_req "GET" "/comments?page=abc" "400" "Invalid page param"
test_req "GET" "/comments?limit=abc" "400" "Invalid limit param"
test_req "DELETE" "/comments/1" "401" "Delete comment without auth"
test_req "PUT" "/comments/1" "404" "Put comment (Method not mapped)"
test_req "GET" "/comments?page=-1" "400" "Page negative"
test_req "GET" "/comments?limit=0" "400" "Limit zero"
test_req "GET" "/comments?page=1.5" "400" "Page float"

# === 3. FAVORITES (/api/favorites) ===
echo -e "\n[3] FAVORITES CONTROLLER"
test_req "GET" "/favorites" "200" "Get all favorites"
test_req "GET" "/favorites?limit=1" "200" "Get favorites limit=1"
test_req "GET" "/favorites?page=1" "200" "Get favorites page=1"

# Failure (5)
test_req "POST" "/favorites" "401" "Add favorite without auth"
test_req "DELETE" "/favorites?bookId=1" "401" "Remove favorite without auth"
test_req "GET" "/favorites?page=xyz" "400" "Invalid page"
test_req "GET" "/favorites?page=0" "400" "Page zero"
test_req "GET" "/favorites?limit=-10" "400" "Limit negative"

# === 4. RATINGS (/api/ratings) ===
echo -e "\n[4] RATINGS CONTROLLER"
test_req "GET" "/ratings" "200" "Get all ratings"
test_req "GET" "/ratings?page=1" "200" "Get ratings page 1"

# Failure (5)
test_req "POST" "/ratings" "401" "Post rating without auth"
test_req "GET" "/ratings?page=bad" "400" "Invalid page"
test_req "GET" "/ratings?page=-5" "400" "Page negative"
test_req "GET" "/ratings?limit=0" "400" "Limit zero"

# === 5. USER-BOOKS (/api/user-books) ===
echo -e "\n[5] USER-BOOKS CONTROLLER"
test_req "GET" "/user-books" "200" "Get all user books"
test_req "POST" "/user-books" "401" "Update status without auth"
test_req "GET" "/user-books?page=not_int" "400" "Invalid page"

# === 6. USERS (/api/users) ===
echo -e "\n[6] USERS CONTROLLER"
test_req "GET" "/users" "200" "Get all users"
test_req "GET" "/users/1" "200" "Get user ID 1"
test_req "GET" "/users/1/friends" "200" "Get user friends"

# Failure (5)
test_req "POST" "/users" "401" "Create user without auth"
test_req "PATCH" "/users/1" "401" "Update user without auth"
test_req "DELETE" "/users/1" "401" "Delete user without auth"
test_req "GET" "/users?page=0" "400" "Page zero"
test_req "GET" "/users?limit=-1" "400" "Negative limit check"

# === 7. TRICKY SCENARIOS ===
echo -e "\n[7] TRICKY SCENARIOS"
test_req "GET" "/books?page=1&page=2" "400" "Duplicate page param (Array)"
test_req "GET" "/books?limit=1&limit=2" "400" "Duplicate limit param (Array)"
test_req "GET" "/books?page=9007199254740992" "400" "Integer Overflow (Page)"
test_req "GET" "/books?page=1e1" "400" "Scientific notation"
test_req "GET" "/books/9007199254740992" "400" "ID Integer Overflow"

# === 8. AUTH (/api/auth) ===
echo -e "\n[8] AUTH CONTROLLER"
test_req "POST" "/auth/login" "400" "Login empty body (Validation Error)" 

# === 9. FRONTEND/VIEWS ===
echo -e "\n[9] FRONTEND/VIEWS"
test_view "GET" "/" "200" "Home Page"
test_view "GET" "/about" "200" "About Page"
test_view "GET" "/users/readers" "200" "Readers List"
test_view "GET" "/users/me" "302" "My Profile (Redirect)"
test_view "GET" "/books/create" "302" "Create Book Page (Redirect)"
test_view "GET" "/login" "200" "Login Page"

# === 10. VIEW ACTIONS ===
echo -e "\n[10] VIEW ACTIONS"
test_view "POST" "/books" "302" "Submit Book Form (Unauth -> Redirect)"
test_view "POST" "/users/1/avatar" "302" "Upload Avatar (Unauth -> Redirect)"
test_view "PATCH" "/users/1" "401" "Update User Profile (API response)"

echo -e "\n-----------------------------------------------------"
echo "Validation Complete."
