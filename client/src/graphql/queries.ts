import { gql } from '@apollo/client';

/**
 * QUERY: GET_MY_PRODUCTS
 * ----------------------------------------------------------------------
 * Fetches the list of products owned by the currently authenticated user.
 * Used for the Dashboard page.
 */
export const GET_MY_PRODUCTS = gql`
  query GetMyProducts {
    myProducts {
      id
      title
      categories
      price
      rentPrice
      rentType
      description
      datePosted
      views
    }
  }
`;

export const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($id: Int!) {
    product(id: $id) {
      id
      title
      description
      categories
      price
      rentPrice
      rentType
      isSold
    }
  }
`;

export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts {
    allProducts {
      id
      title
      categories
      price
      rentPrice
      rentType
      description
      datePosted
      views
    }
  }
`;

/**
 * QUERY: GET_TRANSACTION_HISTORY
 * ----------------------------------------------------------------------
 * Fetches transaction records filtered by type: BOUGHT, SOLD, BORROWED, LENT.
 */
export const GET_TRANSACTION_HISTORY = gql`
  query GetTransactionHistory($filter: String!) {
    myTransactionHistory(filter: $filter) {
      id
      type
      createdAt
      startDate
      endDate
      transactionPrice
      transactionRentPrice
      transactionRentType
      product {
        id
        title
        categories
        price
        rentPrice
        rentType
        description
      }
    }
  }
`;

/**
 * QUERY: GET_MY_TRANSACTION_FOR_PRODUCT
 * ----------------------------------------------------------------------
 * Checks if current user has a transaction for a specific product.
 * Used to show transaction-specific information on product details page.
 */
export const GET_MY_TRANSACTION_FOR_PRODUCT = gql`
  query GetMyTransactionForProduct($productId: Int!) {
    myTransactionForProduct(productId: $productId) {
      id
      type
      createdAt
      startDate
      endDate
      transactionPrice
      transactionRentPrice
      transactionRentType
    }
  }
`;