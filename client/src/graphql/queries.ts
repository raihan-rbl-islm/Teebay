import { gql } from '@apollo/client';

export const GET_ALL_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      title
      categories
      price
      rentPrice
      rentType
    }
  }
`;