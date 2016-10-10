@extends('admin.layout')

@section('content')
<div class="col-lg-12">
    <h2>Emails</h2>
    <table class="table table-hover">
        <tr>
            <th>
                Created At
            </th>
            <th>
                Address
            </th>
            <th>
                Type
            </th>
            <th>
                Subject
            </th>
        </tr>
        @foreach ($emails as $email)        
            <tr onclick="window.location = '/admin/emails/{{$email->id}}'">
                <td>{{$email->created_at}}</td>
                <td>{{$email->address}}</td>
                <td>{{$email->type}}</td>
                <td>{{$email->subject}}</td>
            </tr>
        @endforeach
    </table>

</div>
@stop