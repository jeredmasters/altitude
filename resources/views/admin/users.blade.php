@extends('admin.layout')

@section('content')
<div class="col-lg-12">
    <h2>Users</h2>
    <table class="table table-hover">
        <tr>
            <th>
                Created At
            </th>
            <th>
                Name
            </th>
            <th>
                Email
            </th>
            <th>
                Company
            </th>
        </tr>
        @foreach ($users as $user)
        <tr onclick="window.location = '/admin/users/{{str_replace('.', '%2E',$user->key_base)}}'">
            <td>{{$user->created_at}}</td>
            <td>{{$user->fullname}}</td>
            <td>{{$user->email}}</td>
            <td>{{$user->company}}</td>
        </tr>
        @endforeach
    </table>

</div>
@stop