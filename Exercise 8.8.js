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

import React from 'react'

const Authors = ({ authors }) => {
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
                        <tr key={a.name}>
                            <td>{a.name}</td>
                            <td>{a.born}</td>
                            <td>{a.bookCount}</td>
                        </tr>
                    )}
                </tbody>
            </table>
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
