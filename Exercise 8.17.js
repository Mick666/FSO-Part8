export const ALL_BOOKS = gql`
query allBooks {
  allBooks{
    title
    author {
      name
      born
		}
    published
    genres
  }
}
`