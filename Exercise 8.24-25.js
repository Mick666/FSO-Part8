// index.js

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

import {
    ApolloClient, ApolloProvider, HttpLink, InMemoryCache,
    split
} from '@apollo/client'
import { setContext } from 'apollo-link-context'
import { getMainDefinition } from '@apollo/client/utilities'
import { WebSocketLink } from '@apollo/client/link/ws'

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('phonenumbers-user-token')
    return {
        headers: {
            ...headers,
            authorization: token ? `bearer ${token}` : null,
        }
    }
})

const httpLink = new HttpLink({
    uri: 'http://localhost:4000',
})

const wsLink = new WebSocketLink({
    uri: 'ws://localhost:4000/graphql',
    options: {
        reconnect: true
    }
})

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query)
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        )
    },
    wsLink,
    authLink.concat(httpLink),
)

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: splitLink
})

ReactDOM.render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root')
)

// App.js


import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import FavouriteGenre from './components/FavouriteGenre'
import { useQuery, useApolloClient, useLazyQuery, useSubscription } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, ME, BOOK_ADDED } from './queries'

const Notify = ({ errorMessage }) => {
    if (!errorMessage) {
        return null
    }

    return (
        <div style={{ color: 'red' }}>
            {errorMessage}
        </div>
    )
}

const App = () => {
    const [page, setPage] = useState('authors')
    const [errorMessage, setErrorMessage] = useState(null)
    const [token, setToken] = useState(null)
    const [userDetails, setDetails] = useState(null)
    const authorResult = useQuery(ALL_AUTHORS)
    const bookResult = useQuery(ALL_BOOKS)
    const client = useApolloClient()

    const [getUser, userResult] = useLazyQuery(ME, {
        fetchPolicy: 'network-only'
    })

    const getUserDetails = () => getUser()

    useEffect(() => {
        const token = localStorage.getItem('phonenumbers-user-token')
        if (token) {
            setToken(token)
        }
        if (!userDetails) getUserDetails()
        if (userResult.data) {
            setDetails(userResult.data)
        }

    }, [userResult.data])

    const updateCacheWith = (addedBook) => {
        const includedIn = (set, object) => {
            const modified = set.map(b => b.id)
            return modified.includes(object.id)
        }

        const dataInStore = client.readQuery({ query: ALL_BOOKS })
        if (!includedIn(dataInStore.allBooks, addedBook)) {
            client.writeQuery({
                query: ALL_BOOKS,
                data: { allBooks: dataInStore.allBooks.concat(addedBook) }
            })
        }
    }

    useSubscription(BOOK_ADDED, {
        onSubscriptionData: ({ subscriptionData }) => {
            const addedBook = subscriptionData.data.bookAdded
            notify(`${addedBook.title} added`)
            updateCacheWith(addedBook)
        }
    })

    if (authorResult.loading || bookResult.loading) {
        return <div>loading...</div>
    }

    const notify = (message) => {
        setErrorMessage(message)
        setTimeout(() => {
            setErrorMessage(null)
        }, 10000)
    }

    const logout = () => {
        setToken(null)
        localStorage.clear()
        client.resetStore()
        setDetails(null)

        if (page === 'favourite') setPage('books')
    }

    return (
        <div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
                {token ? <button onClick={() => setPage('favourite')}>favourite genre</button> : null}
                {token ? <button onClick={() => setPage('add')}>add book</button>
                    : null
                }
                {token ? <button onClick={logout} >logout</button> :
                    <button onClick={() => setPage('login')} >login</button>
                }
            </div>
            <Notify errorMessage={errorMessage} />
            <LoginForm
                token={token}
                show={page === 'login'}
                setToken={setToken}
                setError={setErrorMessage}
                setPage={setPage}
                getUserDetails={getUserDetails}
            />
            <Authors
                token={token}
                show={page === 'authors'}
                setError={notify}
                authors={authorResult.data.allAuthors}
            />
            <Books
                show={page === 'books'}
                books={bookResult.data.allBooks}
            />
            <NewBook
                token={token}
                show={page === 'add'}
                setError={notify}
                setPage={setPage}
                updateCacheWith={updateCacheWith}
            />

            <FavouriteGenre
                show={page === 'favourite'}
                books={bookResult.data.allBooks}
                userDetails={userDetails}
            />
        </div>
    )
}

export default App

// Components/NewBook.js

import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_BOOK } from '../queries'

const NewBook = ({ show, setError, setPage, updateCacheWith }) => {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [published, setPublished] = useState('')
    const [genre, setGenre] = useState('')
    const [genres, setGenres] = useState([])

    const [ createBook ] = useMutation(CREATE_BOOK, {
        onError: (error) => {
            console.log(error)
            setError(error.graphQLErrors[0].message)
        },
        update: (store, response) => {
            updateCacheWith(response.data.addBook)
        }
    })

    const submit = async (event) => {
        event.preventDefault()
        console.log('add book...')
        setGenres(genres.filter(x => x.length > 0))
        createBook({
            variables: { title, author, published, genres }
        })

        setTitle('')
        setPublished('')
        setAuthor('')
        setGenres([])
        setGenre('')
        setPage('books')
    }

    const addGenre = () => {
        setGenres(genres.concat(genre))
        setGenre('')
    }

    if (!show) {
        return null
    }

    return (
        <div>
            <form onSubmit={submit}>
                <div>
                    title
                    <input
                        value={title}
                        onChange={({ target }) => setTitle(target.value)}
                    />
                </div>
                <div>
                    author
                    <input
                        value={author}
                        onChange={({ target }) => setAuthor(target.value)}
                    />
                </div>
                <div>
                    published
                    <input
                        type='number'
                        value={published}
                        onChange={({ target }) => setPublished(target.value)}
                    />
                </div>
                <div>
                    <input
                        value={genre}
                        onChange={({ target }) => setGenre(target.value)}
                    />
                    <button onClick={addGenre} type="button">add genre</button>
                </div>
                <div>
                    genres: {genres.join(' ')}
                </div>
                <button type='submit'>create book</button>
            </form>
        </div>
    )
}

export default NewBook

//Queries.js

import { gql } from '@apollo/client'

export const ALL_AUTHORS = gql`
query {
  allAuthors  {
    name
    born
    bookCount
    id
  }
}
`
export const ALL_BOOKS = gql`
query allBooks($genre: String) {
  allBooks (genre: $genre) {
    title
    author {
      name
      born
		}
    published
    genres
    id
  }
}
`

export const CREATE_BOOK = gql `
mutation createBook($title: String!, $author: String!, $published: String!, $genres: [String!]!) {
  addBook(
    title: $title,
    author: $author,
    published: $published,
    genres: $genres
  ) {
    title
    author {
      name
      born
		}
    published
    genres
    id
  }
}
`

export const EDIT_AUTHOR = gql `
mutation editAuthor($name: String!, $setBornTo: String!) {
  editAuthor(name: $name, setBornTo: $setBornTo) {
    id
    name
    born
    bookCount
  }
}
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`

export const ME = gql`
query {
  me {
    favouriteGenre
    username
  }
}
`

export const BOOK_ADDED = gql `
  subscription {
    bookAdded {
      title
      author {
        name
        born
      }
      published
      genres
      id
    }
  }
`

//Book.js

import React, { useState, useEffect } from 'react'
import { useLazyQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const VisibleBooks = ({ books }) => {
    if (!books) return <div>Loading...</div>

    return books.map(a =>
        <tr key={a.title}>
            <td>{a.title}</td>
            <td>{a.author.name}</td>
            <td>{a.published}</td>
        </tr>
    )
}


const Books = ({ show, books }) => {
    const [selectedGenre, setGenre ] = useState(null)
    const [visibleBooks, setVisibleBooks] = useState(books)
    const [getFilteredBooks, genreResult] = useLazyQuery(ALL_BOOKS, {
        fetchPolicy: 'network-only'
    })
    if (!selectedGenre && visibleBooks.length !== books.length) setVisibleBooks(books)

    const getGenre = (genre) => {

        if (genre === 'reset') {
            setVisibleBooks(books)
            setGenre(null)
            return
        }
        setGenre(genre)
        getFilteredBooks({ variables: { genre: genre } })
    }

    useEffect(() => {
        if (genreResult.data) {
            setVisibleBooks(genreResult.data.allBooks)
        }

    }, [genreResult.data])


    if (!show) {
        return null
    }
    const genres = [...new Set(books.map(book => book.genres).flat().filter(x => x.length > 0))]

    return (
        <div>
            <h2>books</h2>
            { selectedGenre ? `Books in selected genre: ${selectedGenre}` : null}
            <table>
                <tbody>
                    <tr style={{ textAlign: 'left' }}>
                        <th>Title</th>
                        <th>
                            author
                        </th>
                        <th>
                            published
                        </th>
                    </tr>
                    <VisibleBooks books={visibleBooks} />
                </tbody>
            </table>
            {genres.map((genre, i) => {
                return <button
                    key={i}
                    onClick={() => getGenre(genre)}
                >
                    {genre}
                </button>
            })
            }
            <button
                onClick={() => getGenre('reset')}
            >
            reset
            </button>
        </div>
    )
}

export default Books
