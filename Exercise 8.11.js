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

//Authors.js

import React, { useEffect, useState } from 'react'
import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR } from '../queries'

const Authors = ({ authors, setError }) => {
    const [name, setName] = useState('Martin Fowler')
    const [setBornTo, setYear] = useState('')

    const [ changeBirthYear, result ] = useMutation(EDIT_AUTHOR)

    useEffect(() => {
        console.log(result)
        if (result.data && !result.data.editAuthor) {
            setError('Name not found')
        }
    }, [result.data])

    const submit = async (event) => {
        event.preventDefault()

        console.log(typeof name, typeof setBornTo)

        changeBirthYear({ variables: { name, setBornTo } })
    }

    return (
        <div>
            <h2>Authors</h2>
            <table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>
                            Born
                        </th>
                        <th>
                            Books
                        </th>
                    </tr>
                    {authors.map(a =>
                        <tr key={a.id}>
                            <td>{a.name}</td>
                            <td>{a.born}</td>
                            <td>{a.bookCount}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div>
                <h2>Set author birthyear</h2>
                <form onSubmit={submit}>
                    <div>
                        Name
                        <input
                            value={name}
                            onChange={({ target }) => setName(target.value)}
                        />
                    </div>
                    <div>
                        Born
                        <input
                            type='number'
                            value={setBornTo}
                            onChange={({ target }) => Number(setYear(target.value))}
                        />
                    </div>
                    <button type='submit'>Update author</button>
                </form>
            </div>
        </div>
    )
}

export default Authors

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