//App.js

import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { useQuery } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS } from './queries'

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
    const authorResult = useQuery(ALL_AUTHORS)
    const bookResult = useQuery(ALL_BOOKS)

    if (authorResult.loading || bookResult.loading) {
        return <div>loading...</div>
    }

    const notify = (message) => {
        setErrorMessage(message)
        setTimeout(() => {
            setErrorMessage(null)
        }, 10000)
    }


    return (
        <div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
                <button onClick={() => setPage('add')}>add book</button>
            </div>
            <Notify errorMessage={errorMessage} />

            {page === 'authors' ?
                <Authors
                    setError={notify}
                    authors={authorResult.data.allAuthors}
                />
                : <div></div>}
            <Books
                show={page === 'books'}
                books={bookResult.data.allBooks}
            />
            {page === 'add' ?
                <NewBook
                    setError={notify}
                    setPage={setPage}
                />
                : <div></div>
            }
        </div>
    )
}

export default App

//NewBook.js

import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ALL_BOOKS, CREATE_BOOK } from '../queries'

const NewBook = ({ setError, setPage }) => {
    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [published, setPublished] = useState('')
    const [genre, setGenre] = useState('')
    const [genres, setGenres] = useState([''])

    const [ createBook ] = useMutation(CREATE_BOOK, {
        refetchQueries: [ { query: ALL_BOOKS } ],
        onError: (error) => {
            console.log(error)
            setError(error.graphQLErrors[0].message)
        }
    })

    const submit = async (event) => {
        event.preventDefault()
        console.log('add book...')
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

// Queries.js

import { gql } from '@apollo/client'

export const ALL_BOOKS = gql`
query {
  allBooks {
    title
    author
    published
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
    author
    published
    genres
  }
}
`