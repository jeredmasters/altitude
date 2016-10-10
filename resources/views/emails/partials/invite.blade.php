@extends('emails.layout')

@section('title', 'Altitude Invite')

@section('content')
    <p>You've been invited to join a company on Altitude - The Flight Tracking System</p>
    <p>Click on the link below to get started</p>
    @include('emails.form.button', ['label' => 'Get Started', 'link' => $url_link])
@stop
