//index.js

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

import {
    ApolloClient, ApolloProvider, HttpLink, InMemoryCache
} from '@apollo/client'
import { setContext } from 'apollo-link-context'

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

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink)
})

ReactDOM.render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>,
    document.getElementById('root')
)


//App.js
import React, { useState, useEffect } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
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
    const authorResult = useQuery(ALL_AUTHORS)
    const bookResult = useQuery(ALL_BOOKS)
    const client = useApolloClient()

    useEffect(() => {
        const token = localStorage.getItem('phonenumbers-user-token')
        if (token) {
            setToken(token)
        }

    }, [])

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
    }

    return (
        <div>
            <div>
                <button onClick={() => setPage('authors')}>authors</button>
                <button onClick={() => setPage('books')}>books</button>
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
                setDetails={getUserDetails}
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
                show={page === 'add'}
                setError={notify}
                setPage={setPage}
            />

        </div>
    )
}

export default App

//Components/LoginForm.js

import React, { useState, useEffect } from 'react'
import { useMutation } from '@apollo/client'
import { LOGIN } from '../queries'

const LoginForm = ({ show, setError, setToken, setPage }) => {
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

//Components/Authors

import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import { useMutation } from '@apollo/client'
import { EDIT_AUTHOR } from '../queries'

const Authors = ({ token, show, authors, setError }) => {
    const [name, setName] = useState(null)
    const [setBornTo, setYear] = useState('')
    const authorNames = authors.map(a => { return { value: a.name, label: a.name } })

    const [changeBirthYear, result] = useMutation(EDIT_AUTHOR)

    useEffect(() => {
        if (result.data && !result.data.editAuthor) {
            setError('Name not found')
        }
    }, [result.data])

    const submit = async (event) => {
        event.preventDefault()
        changeBirthYear({ variables: { name, setBornTo } })
        setName(null)
    }

    if (!show) {
        return null
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
                        <tr key={a.name}>
                            <td>{a.name}</td>
                            <td>{a.born}</td>
                            <td>{a.bookCount}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            { token ?
                <div>
                    <h2>Set author birthyear</h2>
                    <form onSubmit={submit}>
                        <Select
                            value={{ value: name, label: name }}
                            onChange={(selectedOption) => setName(selectedOption.value)}
                            options={authorNames}
                        />
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
                : <div></div>
            }
        </div>
    )
}

export default Authors

// Queries.js
import { gql } from '@apollo/client'

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`