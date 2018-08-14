import React from 'react';
import capitalize from 'capitalize';
import { Bar } from 'watson-react-components';

export default function Table(properties) {
  return (
    <div className="table--container">
        <table className="base--table">
        <thead>
            <tr className="table--header">
            {properties.header ? properties.header.map(i => (
                <th key={i}>{i}</th>
            )) : null}
            </tr>
        </thead>
        <tbody>
            {properties.rows ? properties.rows.map((row, i) => (
            <tr key={`${i}-${row}`} className="table--row">
                {row.map(item => (
                <td key={item}>
                    {typeof item === 'string' ? capitalize.words(item) : <Bar score={item} />}
                </td>
                ))}
            </tr>
            )) : null}
        </tbody>
        </table>
    </div>
  );
}
