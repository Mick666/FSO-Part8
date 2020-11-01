import React, { useState } from 'react'


const Books = ({ show, books }) => {
    const [selectedGenre, setGenre ] = useState(null)
    const [visibleBooks, setVisibleBooks] = useState(books)

    if (!show) {
        return null
    }
    const genres = [...new Set(books.map(book => book.genres).flat())]

    const handleGenreClick = (genre) => {
        if (genre === 'reset') {
            setVisibleBooks(books)
            setGenre(null)
            return
        }
        const filteredBooks = books.filter(book => book.genres.includes(genre))
        setVisibleBooks(filteredBooks)
        setGenre(genre)
    }

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
                    {visibleBooks.map(a =>
                        <tr key={a.title}>
                            <td>{a.title}</td>
                            <td>{a.author.name}</td>
                            <td>{a.published}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {genres.map((genre, i) => {
                return <button
                    key={i}
                    onClick={() => handleGenreClick(genre)}
                >
                    {genre}
                </button>
            })
            }
            <button
                onClick={() => handleGenreClick('reset')}
            >
            reset
            </button>
        </div>
    )
}

export default Books