//App.js


import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import FavouriteGenre from './components/FavouriteGenre'
import { useQuery, useApolloClient, useLazyQuery } from '@apollo/client'
import { ALL_AUTHORS, ALL_BOOKS, ME } from './queries'

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
                { token ?  <button onClick={() => setPage('favourite')}>favourite genre</button> : null}
                { token ? <button onClick={() => setPage('add')}>add book</button>
                    : null
                }
                { token ? <button onClick={logout} >logout</button> :
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

// Components/LoginForm.js

import React, { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN } from '../queries'

const LoginForm = ({ show, setError, setToken, setPage, getUserDetails }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const [login, result] = useMutation(LOGIN, {
        onError: (error) => {
            setError(error.graphQLErrors[0].message)
        }
    })

    useEffect(() => {
        if (result.data) {
            const token = result.data.login.value
            setToken(token)
            localStorage.setItem('phonenumbers-user-token', token)
            getUserDetails()

        }

    }, [result.data])

    const submit = async (event) => {
        event.preventDefault()

        login({ variables: { username, password } })

        setPage('authors')
    }

    if (!show) {
        return null
    }

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={submit}>
                <div>
                    username <input
                        value={username}
                        onChange={({ target }) => setUsername(target.value)}
                    />
                </div>
                <div>
                    password <input
                        type='password'
                        value={password}
                        onChange={({ target }) => setPassword(target.value)}
                    />
                </div>
                <button type='submit'>login</button>
            </form>
        </div>
    )
}

export default LoginForm

// Components/FavouriteGenre.js

import React from 'react'

const FavouriteGenre = ({ show, books, userDetails }) => {
    if (!show) return null

    if (!userDetails) {
        return (
            <div>
                Missing user details
            </div>
        )
    }

    const filteredBooks = books.filter(book => book.genres.includes(userDetails.me.favouriteGenre))

    return (
        <div>
            <h2>books</h2>
            {`Books in favourite genre: ${userDetails.me.favouriteGenre}`}
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
                    {filteredBooks.map(a =>
                        <tr key={a.title}>
                            <td>{a.title}</td>
                            <td>{a.author.name}</td>
                            <td>{a.published}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default FavouriteGenre

//Queries.js

export const ME = gql`
query {
  me {
    favouriteGenre
    username
  }
}
`

