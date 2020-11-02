//App.js unchanged since last exercise, excluded for brevity

// Books.js

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

//Query.js

import { gql } from '@apollo/client'

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
  }
}
`