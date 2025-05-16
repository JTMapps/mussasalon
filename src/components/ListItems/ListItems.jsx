import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

export default function ListItems({ items, renderItem, containerClass, itemClass }) {
  if (!items || items.length === 0) {
    return <p className="text-pink-500">No items to display.</p>;
  }

  // Sort items by datetime or date
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(b.date || b.datetime) - new Date(a.date || a.datetime);
    });
  }, [items]);

  // Default classes for horizontal, two-row layout
  const defaultContainerClass = `
    list-container
    grid grid-rows-2 grid-flow-col auto-cols-max gap-4 
    overflow-x-auto 
    snap-x snap-mandatory
    py-2
  `;

  const defaultItemClass = `
    list-item 
    snap-start 
    flex-shrink-0 
    w-48
  `;

  return (
    <ul className={containerClass || defaultContainerClass}>
      {sortedItems.map(item => (
        <li key={item.id} className={itemClass || defaultItemClass}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

ListItems.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
};
