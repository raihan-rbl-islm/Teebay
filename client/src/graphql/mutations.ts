import { gql } from '@apollo/client';

export const REGISTER_USER = gql`
  mutation Register($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
    register(firstName: $firstName, lastName: $lastName, email: $email, password: $password) {
      id
      firstName
      email
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      id
      firstName
      email
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $title: String!, 
    $description: String!, 
    $price: Float!, 
    $rentPrice: Float!, 
    $rentType: String!, 
    $categories: [Category]!, 
    $ownerId: Int!
  ) {
    createProduct(
      title: $title, 
      description: $description, 
      price: $price, 
      rentPrice: $rentPrice, 
      rentType: $rentType, 
      categories: $categories, 
      ownerId: $ownerId
    ) {
      id
      title
    }
  }
`;