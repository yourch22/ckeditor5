/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Model from '../../src/model/model';
import DocumentFragment from '../../src/model/documentfragment';
import Element from '../../src/model/element';
import Text from '../../src/model/text';
import Position from '../../src/model/position';
import LivePosition from '../../src/model/liveposition';
import Range from '../../src/model/range';
import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';

describe( 'LivePosition', () => {
	let model, doc, root, ul, p, li1, li2;

	beforeEach( () => {
		model = new Model();

		doc = model.document;
		root = doc.createRoot();

		li1 = new Element( 'li', [], new Text( 'abcdef' ) );
		li2 = new Element( 'li', [], new Text( 'foobar' ) );
		ul = new Element( 'ul', [], [ li1, li2 ] );
		p = new Element( 'p', [], new Text( 'qwerty' ) );

		root._insertChild( 0, [ p, ul ] );
	} );

	afterEach( () => {
		doc.destroy();
	} );

	it( 'should be an instance of Position', () => {
		const live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live ).to.be.instanceof( Position );
	} );

	it( 'should throw if given root is not a RootElement', () => {
		expect( () => {
			new LivePosition( new DocumentFragment(), [ 1 ] ); // eslint-disable-line no-new
		} ).to.throw( CKEditorError, /model-liveposition-root-not-rootelement/ );
	} );

	it( 'should listen to the model applyOperation event', () => {
		sinon.spy( LivePosition.prototype, 'listenTo' );

		const live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live.listenTo.calledWith( model, 'applyOperation' ) ).to.be.true;

		LivePosition.prototype.listenTo.restore();
	} );

	it( 'should stop listening when detached', () => {
		sinon.spy( LivePosition.prototype, 'stopListening' );

		const live = new LivePosition( root, [ 0 ] );
		live.detach();

		expect( live.stopListening.called ).to.be.true;

		LivePosition.prototype.stopListening.restore();
	} );

	it( 'createFromPosition should return LivePosition', () => {
		const position = LivePosition.createFromPosition( new Position( root, [ 0 ] ) );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createFromParentAndOffset should return LivePosition', () => {
		const position = LivePosition.createFromParentAndOffset( ul, 0 );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createBefore should return LivePosition', () => {
		const position = LivePosition.createBefore( ul );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	it( 'createAfter should return LivePosition', () => {
		const position = LivePosition.createAfter( ul );
		expect( position ).to.be.instanceof( LivePosition );
		position.detach();
	} );

	describe( 'should get transformed if', () => {
		let live, spy;

		beforeEach( () => {
			live = new LivePosition( root, [ 1, 1, 3 ] );

			spy = sinon.spy();
			live.on( 'change', spy );
		} );

		afterEach( () => {
			live.detach();
		} );

		describe( 'insertion', () => {
			it( 'is in the same parent and closer offset', () => {
				model.change( writer => {
					writer.insertText( 'foo', new Position( root, [ 1, 1, 0 ] ) );
				} );

				expect( live.path ).to.deep.equal( [ 1, 1, 6 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is at the same position and live position is sticking to right side', () => {
				model.change( writer => {
					writer.insertText( 'foo', new Position( root, [ 1, 1, 3 ] ) );
				} );

				expect( live.path ).to.deep.equal( [ 1, 1, 6 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is before a node from the live position path', () => {
				model.change( writer => {
					writer.insert( new Element( 'paragraph' ), new Position( root, [ 1, 0 ] ) );
				} );

				expect( live.path ).to.deep.equal( [ 1, 2, 3 ] );
				expect( spy.calledOnce ).to.be.true;
			} );
		} );

		describe( 'range move', () => {
			it( 'is at the same parent and closer offset', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 1 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 3 );
					const targetPosition = new Position( root, [ 1, 1, 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 1, 6 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is at the same position and live position is sticking to right side', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 1 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 3 );
					const targetPosition = new Position( root, [ 1, 1, 3 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 1, 6 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is at a position before a node from the live position path', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 1 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 2 );
					const targetPosition = new Position( root, [ 1, 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 3, 3 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is from the same parent and closer offset', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 1, 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 2 );
					const targetPosition = new Position( root, [ 1, 0, 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 1, 1 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'is from a position before a node from the live position path', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 1 );
					const targetPosition = new Position( root, [ 1, 2 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 0, 3 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'contains live position (same level)', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 1, 2 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 2 );
					const targetPosition = new Position( root, [ 1, 0, 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 0, 1 ] );
				expect( spy.calledOnce ).to.be.true;
			} );

			it( 'contains live position (deep)', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 1 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 1 );
					const targetPosition = new Position( root, [ 1, 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( [ 1, 0, 3 ] );
				expect( spy.calledOnce ).to.be.true;
			} );
		} );
	} );

	describe( 'should not get transformed if', () => {
		let path, otherRoot, spy, live;

		beforeEach( () => {
			path = [ 1, 1, 3 ];
			otherRoot = doc.createRoot( '$root', 'otherRoot' );
			live = new LivePosition( root, path );

			spy = sinon.spy();
			live.on( 'change', spy );
		} );

		afterEach( () => {
			live.detach();
		} );

		describe( 'insertion', () => {
			it( 'is in the same parent and further offset', () => {
				model.change( writer => {
					writer.insertText( 'foo', new Position( root, [ 1, 1, 6 ] ) );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );

			it( 'is at the same position and live position is sticking to left side', () => {
				const newLive = new LivePosition( root, path, 'sticksToPrevious' );
				spy = sinon.spy();
				newLive.on( 'change', spy );

				model.change( writer => {
					writer.insertText( 'foo', new Position( root, [ 1, 1, 3 ] ) );
				} );

				expect( newLive.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;

				newLive.detach();
			} );

			it( 'is after a node from the position path', () => {
				model.change( writer => {
					writer.insertElement( 'paragraph', new Position( root, [ 2 ] ) );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );

			it( 'is in different root', () => {
				model.change( writer => {
					writer.insertText( 'foo', new Position( otherRoot, [ 0 ] ) );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );
		} );

		describe( 'range move', () => {
			it( 'is at the same parent and further offset', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 3 );
					const targetPosition = new Position( root, [ 1, 1, 6 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );

			it( 'is at the same position and live position is sticking to left side', () => {
				const newLive = new LivePosition( root, path, 'sticksToPrevious' );
				spy = sinon.spy();
				newLive.on( 'change', spy );

				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 3 );
					const targetPosition = new Position( root, [ 1, 1, 3 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( newLive.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;

				newLive.detach();
			} );

			it( 'is at a position after a node from the live position path', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 0, 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 3 );
					const targetPosition = new Position( root, [ 2 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );

			it( 'is from the same parent and further offset', () => {
				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 1, 4 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 2 );
					const targetPosition = new Position( otherRoot, [ 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );

			it( 'is from a position after a node from the live position path', () => {
				const newLive = new LivePosition( root, [ 1, 0, 3 ] );
				spy = sinon.spy();
				newLive.on( 'change', spy );

				model.change( writer => {
					const sourcePosition = new Position( root, [ 1, 1 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 1 );
					const targetPosition = new Position( otherRoot, [ 0 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( newLive.path ).to.deep.equal( [ 1, 0, 3 ] );
				expect( spy.called ).to.be.false;

				newLive.detach();
			} );

			it( 'is from different root', () => {
				model.change( writer => {
					writer.insertText( 'foo', new Position( otherRoot, [ 0 ] ) );

					const sourcePosition = new Position( otherRoot, [ 0 ] );
					const sourceRange = Range.createFromPositionAndShift( sourcePosition, 1 );
					const targetPosition = new Position( otherRoot, [ 3 ] );

					writer.move( sourceRange, targetPosition );
				} );

				expect( live.path ).to.deep.equal( path );
				expect( spy.called ).to.be.false;
			} );
		} );

		it( 'attributes changed', () => {
			model.change( writer => {
				writer.setAttribute( 'foo', 'bar', new Range( new Position( root, [ 1, 1, 0 ] ), new Position( root, [ 1, 1, 6 ] ) ) );
			} );

			expect( live.path ).to.deep.equal( path );
			expect( spy.called ).to.be.false;
		} );
	} );
} );
