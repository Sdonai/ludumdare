import { h, Component } 				from 'preact/preact';
import { shallowDiff }	 				from 'shallow-compare/index';

import NavSpinner						from 'com/nav-spinner/spinner';
import NavLink 							from 'com/nav-link/link';
import SVGIcon 							from 'com/svg-icon/icon';
import IMG2 							from 'com/img2/img2';

import ContentFooterButtonComments		from 'com/content-footer/footer-button-comments';

import ContentCommentsMarkup			from 'comments-markup';

import $Note							from '../../shrub/js/note/note';
import $NoteLove						from '../../shrub/js/note/note_love';

export default class ContentCommentsComment extends Component {
	constructor( props ) {
		super(props);

		this.state = {
			'editing': !!props.editing,
			'preview': !props.editing,
			'modified': false,

			// NOTE: Set this upon save, or use it to cancel
			'original': props.comment.body,

			'loved': props.comment.loved ? true: false,
			'lovecount': props.comment.love,
		};

//		console.log('C '+props.comment.id+": ", this.state.editing,this.state.preview);

		this.onEditing = this.onEditing.bind(this);
		this.onPreview = this.onPreview.bind(this);

		this.onModify = this.onModify.bind(this);

		this.onEdit = this.onEdit.bind(this);

		this.onSave = this.onSave.bind(this);
		this.onCancel = this.onCancel.bind(this);
		this.onPublish = this.onPublish.bind(this);

		this.onLove = this.onLove.bind(this);
		this.onReply = this.onReply.bind(this);
	}

	onEditing( e ) {
		console.log('** Edit Comment');
		this.setState({'preview': false});
	}
	onPreview( e ) {
		console.log('** Preview Comment');
		this.setState({'preview': true});
	}

	canSave() {
		return this.props.comment.body.trim().length > 1;
	}

	onModify( e ) {
		this.props.comment.body = e.target.value;
		this.setState({'modified': this.canSave()});
	}

	onCancel( e ) {
		console.log('cancel');
		this.props.comment.body = this.state.original;
		this.setState({'modified': false, 'editing': false, 'preview': false});
	}

	onSave( e ) {
		var comment = this.props.comment;

		$Note.Update( comment.id, comment.node, comment.body )
		.then(r => {
			console.log(r);

			this.setState({'modified': false, 'editing': false, 'preview': false, 'original': this.props.comment.body});
		})
		.catch(err => {
			this.setState({ 'error': err });
		});
	}

	onPublish( e ) {
		if ( this.canSave() ) {
			if ( this.props.onpublish ) {
				this.props.onpublish(e);

				//this.setState({'modified': false, 'editing': true, 'preview': false});
			}
		}
	}

	onEdit( e ) {
		console.log('edit');
		this.setState({'editing': true, 'preview': false});
	}

	onLove( e ) {
		if ( this.props.user.id != 0 && this.props.user.id != null ) {
			if( this.props.comment.id != null) {
				if ( this.state.loved ) {
					$NoteLove.Remove(this.props.comment.node, this.props.comment.id)
					.then(r => {
						if(r.removed != 0) {
							this.setState({ 'loved': false, 'lovecount': this.state.lovecount - 1 });
						}
					});
				}
				else {
					$NoteLove.Add(this.props.comment.node, this.props.comment.id)
					.then(r => {
						if(r.id != 0) {
							this.setState({ 'loved': true, 'lovecount': this.state.lovecount + 1 });
						}
					});
				}
			}
		}
	}

	onReply( e ) {
		console.log('reply');
	}

	render( {user, comment, author, indent, publish, onpublish, limit, children}, state ) {
//		console.log('R '+comment.id+": ", this.state.editing,this.state.preview);
		if ( author ) {
			var Name = author.name;
			if ( author.meta['real-name'] )
				Name = author.meta['real-name'];

			var Avatar = "///other/dummy/user64.png";
			if ( author.meta['avatar'] )
				Avatar = author.meta['avatar'];

			var ShowTitle = null;
			if ( !state.editing || state.preview ) {
				var Created = new Date(comment.created);
				var Modified = new Date(comment.modified);
				var Now = new Date();
				var DateDiff = (Now.getTime() - Created.getTime());
				var ModDiff = (Modified.getTime() - Created.getTime());

				// 1 minute leeway on edits
				var HasEdited = ModDiff > (60*1000);

				ShowTitle = [
					<div class="-title">
						<span class="-author">{Name}</span> (<NavLink class="-atname" href={"/users/"+author.slug}>{"@"+author.slug}</NavLink>)
					</div>,
				];

				if ( comment.created ) {
					ShowTitle.push(<div class="-date">posted <span title={getLocaleTimeStamp(Created)}>{getRoughAge(DateDiff)}</span><span title={getLocaleDate(Modified)}>{HasEdited?" (edited)":""}</span></div>);
				}
				else {
					ShowTitle.push(<div class="-date">not yet posted</div>);
				}
			}

			var ShowReply = null;
			//if ( user && user.id )
			//	ShowReply = <div class="-reply" onclick={this.onReply}><SVGIcon>reply</SVGIcon> Reply</div>;

			var ShowEdit = null;
			if ( user && comment.author === user.id && !state.editing )
				ShowEdit = <div class="-edit" onclick={this.onEdit}><SVGIcon>edit</SVGIcon> Edit</div>;

			var ShowBottomNav = null;
			//if ( !state.editing )
			{
				ShowBottomNav = (
					<div class="-nav">
						{ShowReply}
						{ShowEdit}
						<div class={"-love"+(state.loved?" -loved":"")} onclick={this.onLove}>
							<SVGIcon class="-hover-hide">heart</SVGIcon>
							<SVGIcon class="-hover-show -loved-hide">heart-plus</SVGIcon>
							<SVGIcon class="-hover-show -loved-show">heart-minus</SVGIcon>
							{Number.isInteger(state.lovecount) ? state.lovecount : comment.love}
						</div>
					</div>
				);
			}

			var ShowTopNav = null;
			if ( state.editing ) {
				var PreviewEdit = null;
				if ( !state.preview ) {
					PreviewEdit = [
						<div class="-preview" onclick={this.onPreview}><SVGIcon>preview</SVGIcon> Preview</div>,
						<div class="-editing -selected"><SVGIcon>edit</SVGIcon> Edit</div>,
					];
				}
				else {
					PreviewEdit = [
						<div class="-preview -selected"><SVGIcon>preview</SVGIcon> Preview</div>,
						<div class="-editing" onclick={this.onEditing}><SVGIcon>edit</SVGIcon> Edit</div>,
					];
				}

				if ( publish ) {
					PreviewEdit.push(<div class={"-publish"+(state.modified?" -modified":"")} onclick={this.onPublish}><SVGIcon>publish</SVGIcon> Publish</div>);
				}
				else {
					PreviewEdit.push(<div class="-cancel" onclick={this.onCancel}><SVGIcon>cross</SVGIcon> Cancel</div>);
					PreviewEdit.push(<div class={"-save"+(state.modified?" -modified":"")} onclick={this.onSave}><SVGIcon>save</SVGIcon> Save</div>);
				}

				ShowTopNav = (
					<div class="-nav">
						{PreviewEdit}
					</div>
				);
			}

			return (
				<div id={"comment-"+comment.id} class={"-item -comment -indent-"+indent}>
					<div class="-avatar"><IMG2 src={Avatar} /></div>
					<div class="-body">
						{ShowTopNav}
						{ShowTitle}
						<ContentCommentsMarkup user={user} class="-text" editing={state.editing && !state.preview} onmodify={this.onModify} placeholder="type a comment here" limit={limit}>{comment.body}</ContentCommentsMarkup>
						{ShowBottomNav}
					</div>
					{children}
				</div>
			);
		}
		else {
			return (
				<div class={"-item -comment -indent-"+indent}>
					<div class="-body">There was a problem with this node</div>
				</div>
			);
		}
	}
}
