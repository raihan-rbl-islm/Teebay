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