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

// Books.js

import React from 'react'


const Books = ({ show, books }) => {
    if (!show) {
        return null
    }

    return (
        <div>
            <h2>books</h2>

            <table>
                <tbody>
                    <tr>
                        <th></th>
                        <th>
                            author
                        </th>
                        <th>
                            published
                        </th>
                    </tr>
                    {books.map(a =>
                        <tr key={a.title}>
                            <td>{a.title}</td>
                            <td>{a.author}</td>
                            <td>{a.published}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default Books

//Queries.js

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